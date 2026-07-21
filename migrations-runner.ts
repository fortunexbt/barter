import { eq, or } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './shared/schema.js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

// Only run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations().catch((error) => {
    console.error("Migration command failed:", error);
    process.exitCode = 1;
  });
}

export async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    console.log("No DATABASE_URL set; using the in-memory prototype store.");
    return false;
  }

  console.log("🔄 Checking database schema and running migrations if needed...");

  try {
    // Create the postgres client with proper SSL configuration
    const migrationClient = postgres(process.env.DATABASE_URL, { 
      ssl: 'require',
      max: 1, // Use minimal connection for migrations
    });

    // Initialize Drizzle with the PostgreSQL client
    const db = drizzle(migrationClient, { schema });

    // Define migrations directory
    const migrationsFolder = './migrations';

    try {
      // Check if schema already exists (check for users table)
      const tableCheck = await migrationClient`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        );
      `;
      
      const tablesExist = tableCheck[0]?.exists || false;
      
      if (tablesExist) {
        console.log("✅ Database tables already exist. Skipping migrations.");
      } else {
        console.log("🔄 Creating database tables...");
        
        // Use the db object to create all tables from schema
        // Since we don't have migrations files at the moment, let's create tables directly
        await migrationClient`
          -- Users table
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            full_name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            role TEXT,
            kyc_status TEXT,
            account_level TEXT,
            trading_since TIMESTAMP,
            profile_image TEXT,
            wallet_address TEXT,
            verification_level TEXT,
            credit_score INTEGER,
            preferred_currency TEXT DEFAULT 'USD',
            address TEXT,
            phone TEXT,
            identity_commitment TEXT,
            zkp_identity TEXT,
            zkp_verified BOOLEAN
          );

          -- Commodities table
          CREATE TABLE IF NOT EXISTS commodities (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            status TEXT,
            grade TEXT NOT NULL,
            price DOUBLE PRECISION NOT NULL,
            price_unit TEXT NOT NULL,
            volume DOUBLE PRECISION NOT NULL,
            volume_unit TEXT NOT NULL,
            owner_id INTEGER NOT NULL REFERENCES users(id),
            description TEXT,
            category TEXT,
            subcategory TEXT,
            origin TEXT,
            image_url TEXT,
            certifications JSONB DEFAULT '[]'::jsonb,
            market_trend TEXT,
            contract_address TEXT,
            created_at TIMESTAMP,
            icon TEXT,
            icon_bg TEXT
          );

          -- Barter offers table
          CREATE TABLE IF NOT EXISTS barter_offers (
            id SERIAL PRIMARY KEY,
            status TEXT,
            title TEXT NOT NULL,
            created_at TIMESTAMP,
            offering_commodity_id INTEGER NOT NULL REFERENCES commodities(id),
            requesting_commodity_id INTEGER NOT NULL REFERENCES commodities(id),
            offering_user_id INTEGER NOT NULL REFERENCES users(id),
            requesting_user_id INTEGER NOT NULL REFERENCES users(id),
            value_match INTEGER NOT NULL,
            offerer_id INTEGER,
            offered_commodity_id INTEGER,
            desired_commodity_id INTEGER,
            offer_volume DOUBLE PRECISION,
            desired_volume DOUBLE PRECISION,
            expiration_date TIMESTAMP,
            barter_ratio DOUBLE PRECISION,
            match_score INTEGER
          );

          -- Contracts table
          CREATE TABLE IF NOT EXISTS contracts (
            id SERIAL PRIMARY KEY,
            status TEXT,
            price DOUBLE PRECISION NOT NULL,
            title TEXT NOT NULL,
            created_at TIMESTAMP,
            contract_number TEXT NOT NULL,
            seller_id INTEGER NOT NULL REFERENCES users(id),
            buyer_id INTEGER NOT NULL REFERENCES users(id),
            commodity_id INTEGER NOT NULL REFERENCES commodities(id),
            quantity DOUBLE PRECISION NOT NULL,
            terms TEXT NOT NULL,
            amount DOUBLE PRECISION,
            contract_type TEXT,
            payment_terms TEXT,
            delivery_date TIMESTAMP,
            smart_contract_address TEXT,
            delivery_method TEXT,
            terms_hash TEXT,
            documents JSONB DEFAULT '[]'::jsonb,
            updated_at TIMESTAMP
          );

          -- Transactions table
          CREATE TABLE IF NOT EXISTS transactions (
            id SERIAL PRIMARY KEY,
            type TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at TIMESTAMP,
            commodity_id INTEGER REFERENCES commodities(id),
            sender_id INTEGER NOT NULL REFERENCES users(id),
            receiver_id INTEGER NOT NULL REFERENCES users(id),
            barter_id INTEGER REFERENCES barter_offers(id),
            contract_id INTEGER REFERENCES contracts(id),
            amount DOUBLE PRECISION,
            metadata TEXT
          );

          -- Notifications table
          CREATE TABLE IF NOT EXISTS notifications (
            id SERIAL PRIMARY KEY,
            title TEXT DEFAULT 'Protocol notice',
            message TEXT NOT NULL,
            type TEXT NOT NULL,
            created_at TIMESTAMP,
            icon TEXT,
            icon_bg TEXT,
            user_id INTEGER NOT NULL REFERENCES users(id),
            read BOOLEAN
          );

          -- KYC documents table
          CREATE TABLE IF NOT EXISTS kyc_documents (
            id SERIAL PRIMARY KEY,
            identity_commitment TEXT,
            zkp_verified BOOLEAN,
            user_id INTEGER NOT NULL REFERENCES users(id),
            document_type TEXT NOT NULL,
            document_number TEXT NOT NULL,
            verified BOOLEAN,
            status TEXT DEFAULT 'pending',
            file_url TEXT,
            verified_at TIMESTAMP,
            verified_by TEXT,
            uploaded_at TIMESTAMP,
            verification_proof_id TEXT
          );

          -- Sessions table for authentication
          CREATE TABLE IF NOT EXISTS sessions (
            sid VARCHAR NOT NULL PRIMARY KEY,
            sess JSON NOT NULL,
            expire TIMESTAMP(6) NOT NULL
          );
          
          CREATE INDEX IF NOT EXISTS "IDX_sessions_expire" ON "sessions" ("expire");
        `;
        
        console.log("✅ Database tables created successfully!");
      }
    } catch (error) {
      console.error("❌ Error creating database tables:", error);
      throw error;
    } finally {
      // Always close the migration client
      await migrationClient.end();
    }

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
  
  console.log("✅ Database is ready!");
  return true;
}
