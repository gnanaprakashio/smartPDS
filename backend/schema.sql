-- SmartQueue AI Ration System - PostgreSQL Schema
-- Run: psql -d smartqueue -f schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE card_type AS ENUM ('AAY', 'PHH', 'NPHH', 'NPHH_S');
CREATE TYPE slot_status AS ENUM ('SCHEDULED', 'COMPLETED', 'MISSED');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ration_card_number VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(15) UNIQUE NOT NULL,
  card_type card_type NOT NULL,
  reputation_score NUMERIC(5,2) DEFAULT 100.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_ration_card ON users(ration_card_number);
CREATE INDEX idx_users_phone ON users(phone);

-- Inventory table (per shop)
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id VARCHAR(50) UNIQUE NOT NULL,
  rice_stock NUMERIC(10,2) DEFAULT 0,
  sugar_stock NUMERIC(10,2) DEFAULT 0,
  wheat_stock NUMERIC(10,2) DEFAULT 0,
  oil_stock NUMERIC(10,2) DEFAULT 0,
  toor_dal_stock NUMERIC(10,2) DEFAULT 0,  -- Toor Dal (pulses) - TNPDS allocation
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inventory_shop ON inventory(shop_id);

-- Slots table
CREATE TABLE slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_date TIMESTAMP WITH TIME ZONE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_users INTEGER NOT NULL CHECK (max_users > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_slots_date ON slots(slot_date);

-- Slot Assignments
CREATE TABLE slot_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slot_id UUID NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
  status slot_status DEFAULT 'SCHEDULED',
  UNIQUE(user_id, slot_id)
);

CREATE INDEX idx_assignments_user ON slot_assignments(user_id);
CREATE INDEX idx_assignments_slot ON slot_assignments(slot_id);

-- OTP Verification
CREATE TABLE otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  otp VARCHAR(6) NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_otp_user ON otp_verifications(user_id);
CREATE INDEX idx_otp_created ON otp_verifications(created_at);

-- Reputation Logs
CREATE TABLE reputation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  change_reason TEXT NOT NULL,
  score_change NUMERIC(5,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reputation_user ON reputation_logs(user_id);

-- Fraud Logs
CREATE TABLE fraud_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fraud_user ON fraud_logs(user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data
INSERT INTO inventory (shop_id) VALUES ('SHOP001');
INSERT INTO users (ration_card_number, name, phone, card_type) VALUES 
  ('RC001', 'Test User', '9999999999', 'PHH');
