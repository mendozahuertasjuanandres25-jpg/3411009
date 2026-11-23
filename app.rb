require "bcrypt"
require "digest"
require "fileutils"
require "json"
require "mysql2"
require "rack/session/cookie"
require "securerandom"
require "sinatra/base"
require "time"

DEMO_MODE = ENV.fetch("DEMO_MODE", "true").downcase != "false"
SESSION_SECRET = ENV.fetch("SESSION_SECRET", "")
SESSION_SECRET = SecureRandom.hex(64) if SESSION_SECRET.bytesize < 64

class InventarioApp < Sinatra::Base
  APP_ROOT = File.expand_path(__dir__)
  DEMO_MUTEX = Mutex.new
  DEMO_USERS = {}
  DEMO_SESSIONS = {}
  DEMO_PURCHASES = Hash.new { |hash, key| hash[key] = [] }
  DEMO_NEXT_USER_ID = { value: 1 }
  PHOTO_DIRECTORY = File.join(APP_ROOT, "storage", "profile_photos")
  MAX_REQUEST_BYTES = 1_200_000
  MAX_PHOTO_BYTES = 1_048_576
  SESSION_SECONDS = 8 * 60 * 60
  REMEMBERED_SESSION_SECONDS = 30 * 24 * 60 * 60
  EMAIL_PATTERN = /\A[^\s@]+@[^\s@]+\.[^\s@]+\z/
  PHOTO_TYPES = {
    "jpeg" => { extension: "jpg", content_type: "image/jpeg" },
    "png" => { extension: "png", content_type: "image/png" },
    "webp" => { extension: "webp", content_type: "image/webp" },
  }.freeze
  DEMO_PRODUCTS = {
    "teclado-inalambrico" => { name: "Teclado inalámbrico", price: 85_000 },
    "mouse-optico" => { name: "Mouse óptico", price: 42_000 },
    "ssd-480gb" => { name: "Unidad SSD 480 GB", price: 165_000 },
    "monitor-24" => { name: "Monitor de 24 pulgadas", price: 620_000 },
  }.freeze
  DUMMY_PASSWORD_HASH = BCrypt::Password.create(SecureRandom.hex(32)).to_s

  class InvalidInput < StandardError; end

  set :root, APP_ROOT
  set :static, false
  set :bind, ENV.fetch("BIND", "127.0.0.1")
  set :port, Integer(ENV.fetch("PORT", "4567"))

  use Rack::Session::Cookie,
      key: "inventario_sena.session",
      secret: SESSION_SECRET,
      httponly: true,
      same_site: :strict,
      secure: ENV["RACK_ENV"] == "production",
      max_age: REMEMBERED_SESSION_SECONDS,
      path: "/"

  helpers do
    def database
      Mysql2::Client.new(
        host: ENV.fetch("DB_HOST", "127.0.0.1"),
        port: Integer(ENV.fetch("DB_PORT", "3306")),
        username: ENV.fetch("DB_USER"),
        password: ENV.fetch("DB_PASSWORD"),
        database: ENV.fetch("DB_NAME", "inventario_sena"),
        encoding: "utf8mb4",
        connect_timeout: 5,
        reconnect: false,
        symbolize_keys: true
      )
    end

    def with_database
      connection = database
      yield connection
    ensure
      connection.close if connection
    end

    def execute(connection, sql, *values)
      statement = connection.prepare(sql)
      statement.execute(*values)
    ensure
      statement.close if statement
    end

    def json_response(payload)
      content_type :json
      JSON.generate(payload)
    end

    def api_error(status_code, message)
      halt status_code, json_response(error: message)
    end

    def enforce_request_size!
      return unless request.content_length
      api_error(413, "El archivo o formulario supera el tamaño permitido.") if request.content_length > MAX_REQUEST_BYTES
    end

    def verify_request_origin!
      origin = request.env["HTTP_ORIGIN"]
      expected_origin = ENV["APP_ORIGIN"] || request.base_url
      api_error(403, "La solicitud no tiene un origen permitido.") if origin && origin != expected_origin
    end

    def constant_time_equal?(left, right)
      return false unless left.is_a?(String) && right.is_a?(String) && left.bytesize == right.bytesize
      Rack::Utils.secure_compare(left, right)
    end

    def verify_csrf!
      expected = session[:csrf_token]
      supplied = request.env["HTTP_X_CSRF_TOKEN"]
      api_error(403, "La sesión expiró. Recarga la página e inténtalo de nuevo.") unless constant_time_equal?(expected, supplied)
    end

    def find_user_by_id(user_id)
      if DEMO_MODE
        return nil unless session[:auth_token]
        session_record = DEMO_MUTEX.synchronize do
          DEMO_SESSIONS[Digest::SHA256.hexdigest(session[:auth_token])]
        end
        return nil unless session_record && session_record[:user_id] == user_id && session_record[:expires_at] > Time.now.utc

        DEMO_MUTEX.synchronize do
          user = DEMO_USERS[user_id]
          next nil unless user
          user.merge(csrf_token: session_record[:csrf_token])
        end
      else
      with_database do |connection|
        execute(
          connection,
          "SELECT u.id, u.full_name, u.email, u.photo_filename, s.csrf_token " \
          "FROM auth_sessions s JOIN users u ON u.id = s.user_id " \
          "WHERE s.token_digest = ? AND s.user_id = ? AND s.expires_at > UTC_TIMESTAMP()",
          Digest::SHA256.hexdigest(session[:auth_token]),
          user_id
        ).first
      end
      end
    end

    def authenticated_user
      return @authenticated_user if defined?(@authenticated_user)

      if DEMO_MODE
        token = session[:auth_token]
        if token.is_a?(String) && token.match?(/\A[0-9a-f]{64}\z/)
          @authenticated_user = find_user_by_id(session[:user_id])
          return @authenticated_user if @authenticated_user
        end

        token = SecureRandom.hex(32)
        csrf_token = SecureRandom.hex(32)
        DEMO_MUTEX.synchronize do
          DEMO_USERS[0] ||= {
            id: 0,
            full_name: "Usuario de demostración",
            email: "demo@sena.test",
            password_digest: DUMMY_PASSWORD_HASH,
            photo_filename: nil,
          }
          DEMO_SESSIONS[Digest::SHA256.hexdigest(token)] = {
            user_id: 0,
            csrf_token: csrf_token,
            expires_at: Time.now.utc + REMEMBERED_SESSION_SECONDS,
          }
        end
        session.clear
        session[:auth_token] = token
        session[:user_id] = 0
        session[:csrf_token] = csrf_token
        @authenticated_user = DEMO_USERS[0].merge(csrf_token: csrf_token)
        return @authenticated_user
      end

      token = session[:auth_token]
      unless token.is_a?(String) && token.match?(/\A[0-9a-f]{64}\z/)
        @authenticated_user = nil
        return nil
      end

      @authenticated_user = find_user_by_id(session[:user_id])
      session.clear unless @authenticated_user
      @authenticated_user
    end

    def require_authenticated_user!
      user = authenticated_user
      api_error(401, "Inicia sesión para continuar.") unless user
      user
    end

    def verify_registration_fields!
      name = params["full_name"].to_s.strip
      email = params["email"].to_s.strip.downcase
      password = params["password"].to_s
      confirmation = params["password_confirmation"].to_s

      raise InvalidInput, "Escribe tu nombre completo (máximo 120 caracteres)." if name.empty? || name.length > 120 || name.match?(/[\u0000-\u001F\u007F]/)
      raise InvalidInput, "Escribe un correo electrónico válido." if email.length > 254 || !EMAIL_PATTERN.match?(email)
      raise InvalidInput, "La contraseña debe tener al menos 10 caracteres." if password.length < 10
      raise InvalidInput, "La contraseña supera el máximo seguro permitido." if password.bytesize > 72
      raise InvalidInput, "Las contraseñas no coinciden." unless password == confirmation

      { name: name, email: email, password: password }
    end

    def save_profile_photo(upload)
      return nil unless upload
      return nil if upload.respond_to?(:original_filename) && upload.original_filename.to_s.empty?
      raise InvalidInput, "El formato de la foto no es válido." unless upload.respond_to?(:tempfile)

      tempfile = upload.tempfile
      raise InvalidInput, "La foto debe pesar máximo 1 MB." if File.size(tempfile.path) > MAX_PHOTO_BYTES

      tempfile.rewind
      signature = tempfile.read(12).to_s.b
      tempfile.rewind
      kind = if signature.start_with?("\xFF\xD8\xFF".b)
        "jpeg"
      elsif signature.start_with?("\x89PNG\r\n\x1A\n".b)
        "png"
      elsif signature.byteslice(0, 4) == "RIFF" && signature.byteslice(8, 4) == "WEBP"
        "webp"
      end
      raise InvalidInput, "La foto debe ser JPG, PNG o WebP." unless kind

      FileUtils.mkdir_p(PHOTO_DIRECTORY)
      filename = "#{SecureRandom.hex(24)}.#{PHOTO_TYPES.fetch(kind)[:extension]}"
      FileUtils.copy_file(tempfile.path, File.join(PHOTO_DIRECTORY, filename))
      filename
    rescue SystemCallError
      raise InvalidInput, "No se pudo guardar la foto. Inténtalo de nuevo."
    end

    def delete_profile_photo(filename)
      return unless filename.is_a?(String) && filename.match?(/\A[0-9a-f]{48}\.(jpg|png|webp)\z/)
      FileUtils.rm_f(File.join(PHOTO_DIRECTORY, filename))
    end

    def public_user(user)
      {
        id: user[:id],
        full_name: user[:full_name],
        email: user[:email],
        photo_url: user[:photo_filename] ? "/api/me/photo" : nil,
      }
    end

    def find_authenticated_user_by_email(email)
      if DEMO_MODE
        DEMO_MUTEX.synchronize do
          DEMO_USERS.values.find { |user| user[:email] == email }
        end
      else
      with_database do |connection|
        execute(
          connection,
          "SELECT id, full_name, email, password_digest, photo_filename FROM users WHERE email = ? LIMIT 1",
          email
        ).first
      end
      end
    end
  end

  before do
    headers(
      "X-Content-Type-Options" => "nosniff",
      "X-Frame-Options" => "DENY",
      "Referrer-Policy" => "strict-origin-when-cross-origin",
      "Permissions-Policy" => "camera=(), microphone=(), geolocation=()",
      "Content-Security-Policy" => "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"
    )
    if request.path.start_with?("/api/")
      content_type :json
      headers "Cache-Control" => "no-store"
    end
  end

  get "/" do
    redirect "/html/login.html"
  end

  get %r{\A/html/([A-Za-z0-9_-]+)\.html\z} do |page|
    file_path = File.join(APP_ROOT, "html", "#{page}.html")
    halt 404 unless File.file?(file_path)
    unless %w[login registro].include?(page)
      redirect "/html/login.html" unless authenticated_user
      headers "Cache-Control" => "no-store"
    end
    content_type "text/html; charset=utf-8"
    send_file file_path, disposition: "inline"
  end

  get %r{\A/(css|js|img)/([A-Za-z0-9_.-]+)\z} do |directory, filename|
    file_path = File.join(APP_ROOT, directory, filename)
    halt 404 unless File.file?(file_path)

    content_type case File.extname(filename).downcase
    when ".css" then "text/css; charset=utf-8"
    when ".js" then "application/javascript; charset=utf-8"
    when ".svg" then "image/svg+xml"
    when ".png" then "image/png"
    else "application/octet-stream"
    end
    send_file file_path, disposition: "inline"
  end

  get "/api/me" do
    user = require_authenticated_user!
    json_response(user: public_user(user), csrf_token: user[:csrf_token])
  end

  get "/api/me/photo" do
    user = require_authenticated_user!
    filename = user[:photo_filename]
    api_error(404, "No hay una foto de perfil.") unless filename
    api_error(404, "No hay una foto de perfil.") unless filename.match?(/\A[0-9a-f]{48}\.(jpg|png|webp)\z/)

    path = File.join(PHOTO_DIRECTORY, filename)
    api_error(404, "No se encontró la foto de perfil.") unless File.file?(path)
    extension = File.extname(filename)
    content_type({ ".jpg" => "image/jpeg", ".png" => "image/png", ".webp" => "image/webp" }.fetch(extension))
    headers "Cache-Control" => "private, no-store"
    send_file path, disposition: "inline"
  end

  post "/api/register" do
    enforce_request_size!
    verify_request_origin!
    fields = verify_registration_fields!
    photo_filename = nil

    begin
      photo_filename = save_profile_photo(params["profile_photo"])
      password_digest = BCrypt::Password.create(fields[:password]).to_s
      if DEMO_MODE
        DEMO_MUTEX.synchronize do
          if DEMO_USERS.values.any? { |user| user[:email] == fields[:email] }
            raise InvalidInput, "Ese correo ya tiene una cuenta. Inicia sesión o usa otro correo."
          end

          user_id = DEMO_NEXT_USER_ID[:value]
          DEMO_NEXT_USER_ID[:value] += 1
          DEMO_USERS[user_id] = {
            id: user_id,
            full_name: fields[:name],
            email: fields[:email],
            password_digest: password_digest,
            photo_filename: photo_filename,
          }
        end
      else
        with_database do |connection|
          execute(
            connection,
            "INSERT INTO users (full_name, email, password_digest, photo_filename) VALUES (?, ?, ?, ?)",
            fields[:name],
            fields[:email],
            password_digest,
            photo_filename
          )
        end
      end
    rescue InvalidInput => error
      delete_profile_photo(photo_filename)
      api_error(422, error.message)
    rescue Mysql2::Error => error
      delete_profile_photo(photo_filename)
      if error.error_number == 1062
        api_error(409, "Ese correo ya tiene una cuenta. Inicia sesión o usa otro correo.")
      end
      logger.error("Registration database error: #{error.class}")
      api_error(500, "No se pudo crear la cuenta. Verifica la conexión con la base de datos.")
    end

    status 201
    json_response(message: "Cuenta creada.", full_name: fields[:name], email: fields[:email])
  end

  post "/api/login" do
    enforce_request_size!
    verify_request_origin!
    email = params["email"].to_s.strip.downcase
    password = params["password"].to_s
    api_error(422, "Escribe un correo y una contraseña válidos.") if email.empty? || password.empty?
    api_error(422, "Escribe un correo electrónico válido.") if email.length > 254 || !EMAIL_PATTERN.match?(email)
    api_error(422, "La contraseña supera el máximo permitido.") if password.bytesize > 72

    user = find_authenticated_user_by_email(email)
    password_digest = user ? user[:password_digest] : DUMMY_PASSWORD_HASH
    valid_password = BCrypt::Password.new(password_digest) == password
    api_error(401, "El correo o la contraseña son incorrectos.") unless user && valid_password

    remember = params["remember_me"] == "true"
    expires_in = remember ? REMEMBERED_SESSION_SECONDS : SESSION_SECONDS
    token = SecureRandom.hex(32)
    csrf_token = SecureRandom.hex(32)
    expires_at = (Time.now.utc + expires_in).strftime("%Y-%m-%d %H:%M:%S")

    if DEMO_MODE
      DEMO_MUTEX.synchronize do
        DEMO_SESSIONS.delete_if { |_digest, record| record[:expires_at] <= Time.now.utc }
        DEMO_SESSIONS[Digest::SHA256.hexdigest(token)] = {
          user_id: user[:id],
          csrf_token: csrf_token,
          expires_at: Time.now.utc + expires_in,
        }
      end
    else
      with_database do |connection|
        execute(connection, "DELETE FROM auth_sessions WHERE expires_at <= UTC_TIMESTAMP()")
        execute(
          connection,
          "INSERT INTO auth_sessions (token_digest, user_id, csrf_token, expires_at) VALUES (?, ?, ?, ?)",
          Digest::SHA256.hexdigest(token),
          user[:id],
          csrf_token,
          expires_at
        )
      end
    end
    session.clear
    session.options[:expire_after] = expires_in
    session[:auth_token] = token
    session[:user_id] = user[:id]
    session[:csrf_token] = csrf_token

    json_response(user: public_user(user), csrf_token: csrf_token)
  end

  post "/api/logout" do
    user = require_authenticated_user!
    verify_csrf!
    digest = Digest::SHA256.hexdigest(session[:auth_token])
    if DEMO_MODE
      DEMO_MUTEX.synchronize { DEMO_SESSIONS.delete(digest) }
    else
      with_database do |connection|
        execute(connection, "DELETE FROM auth_sessions WHERE token_digest = ? AND user_id = ?", digest, user[:id])
      end
    end
    session.clear
    json_response(message: "Sesión cerrada.")
  end

  post "/api/profile" do
    enforce_request_size!
    user = require_authenticated_user!
    verify_csrf!
    name = params["full_name"].to_s.strip
    api_error(422, "Escribe tu nombre completo (máximo 120 caracteres).") if name.empty? || name.length > 120 || name.match?(/[\u0000-\u001F\u007F]/)

    new_photo_filename = nil
    photo_filename = user[:photo_filename]
    begin
      new_photo_filename = save_profile_photo(params["profile_photo"])
      if new_photo_filename
        photo_filename = new_photo_filename
      elsif params["remove_photo"] == "true"
        photo_filename = nil
      end

      if DEMO_MODE
        DEMO_MUTEX.synchronize do
          DEMO_USERS[user[:id]][:full_name] = name
          DEMO_USERS[user[:id]][:photo_filename] = photo_filename
        end
      else
        with_database do |connection|
          execute(
            connection,
            "UPDATE users SET full_name = ?, photo_filename = ? WHERE id = ?",
            name,
            photo_filename,
            user[:id]
          )
        end
      end
    rescue InvalidInput => error
      delete_profile_photo(new_photo_filename)
      api_error(422, error.message)
    rescue Mysql2::Error => error
      delete_profile_photo(new_photo_filename)
      logger.error("Profile update database error: #{error.class}")
      api_error(500, "No se pudo actualizar el perfil.")
    end

    delete_profile_photo(user[:photo_filename]) if user[:photo_filename] && user[:photo_filename] != photo_filename
    json_response(
      user: public_user(
        id: user[:id],
        full_name: name,
        email: user[:email],
        photo_filename: photo_filename
      )
    )
  end

  get "/api/purchases" do
    user = require_authenticated_user!
    purchases = if DEMO_MODE
      DEMO_MUTEX.synchronize do
        DEMO_PURCHASES[user[:id]].map(&:dup)
      end
    else
      with_database do |connection|
        execute(
          connection,
          "SELECT product_id, product_name, price, purchased_at FROM demo_purchases " \
          "WHERE user_id = ? ORDER BY purchased_at DESC, id DESC",
          user[:id]
        ).to_a
      end
    end
    purchases = purchases.map do |purchase|
      {
        product_id: purchase[:product_id],
        product_name: purchase[:product_name],
        price: purchase[:price].to_f,
        purchased_at: purchase[:purchased_at].utc.iso8601,
      }
    end
    json_response(purchases: purchases)
  end

  post "/api/purchases" do
    user = require_authenticated_user!
    verify_csrf!
    product = DEMO_PRODUCTS[params["product_id"].to_s]
    api_error(422, "El producto seleccionado no está disponible.") unless product

    if DEMO_MODE
      DEMO_MUTEX.synchronize do
        DEMO_PURCHASES[user[:id]].unshift(
          product_id: params["product_id"],
          product_name: product[:name],
          price: product[:price],
          purchased_at: Time.now.utc
        )
      end
    else
      with_database do |connection|
        execute(
          connection,
          "INSERT INTO demo_purchases (user_id, product_id, product_name, price) VALUES (?, ?, ?, ?)",
          user[:id],
          params["product_id"],
          product[:name],
          product[:price]
        )
      end
    end
    json_response(message: "Compra de demostración registrada.")
  end

  error Mysql2::Error do
    error = env["sinatra.error"]
    logger.error("Database request failed: #{error.class}")
    if request.path.start_with?("/api/")
      status 503
      json_response(error: "No se pudo acceder a la base de datos. Inténtalo de nuevo.")
    else
      status 503
      "No se pudo acceder a la base de datos. Inténtalo de nuevo."
    end
  end

  run! if $PROGRAM_NAME == __FILE__
end
