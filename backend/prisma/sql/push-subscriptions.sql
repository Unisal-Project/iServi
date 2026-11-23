CREATE TABLE IF NOT EXISTS push_subscriptions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    attendance_id BIGINT UNSIGNED NOT NULL,
    session_id VARCHAR(36) NOT NULL,
    endpoint TEXT NOT NULL,
    endpoint_hash CHAR(64) NOT NULL,
    p256dh VARCHAR(255) NOT NULL,
    auth VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uq_push_subscriptions_attendance_endpoint (
        attendance_id,
        endpoint_hash
    ),

    KEY idx_push_subscriptions_attendance_active (
        attendance_id,
        active
    ),

    KEY idx_push_subscriptions_expires_at (expires_at),

    CONSTRAINT fk_push_subscriptions_attendance
        FOREIGN KEY (attendance_id)
        REFERENCES attendances (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;