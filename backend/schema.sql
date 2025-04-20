CREATE TABLE IF NOT EXISTS restaurants (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(120) NOT NULL,
    description     TEXT,
    phone           VARCHAR(25),
    email           VARCHAR(120),
    address         TEXT,
    latitude        DECIMAL(9,6) NOT NULL,
    longitude       DECIMAL(9,6) NOT NULL,
    seats_total     INT CHECK (seats_total > 0),
    seats_free      INT,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    google_id       VARCHAR(60) UNIQUE NOT NULL,
    email           VARCHAR(120) UNIQUE NOT NULL,
    role            VARCHAR(20) DEFAULT 'customer',
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reservations (
    id              SERIAL PRIMARY KEY,
    user_id         INT REFERENCES users(id),
    restaurant_id   INT REFERENCES restaurants(id),
    reservation_at  TIMESTAMP NOT NULL,
    guests          INT CHECK (guests > 0),
    status          VARCHAR(20) DEFAULT 'confirmed',
    created_at      TIMESTAMP DEFAULT NOW()
);
