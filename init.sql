DROP DATABASE IF EXISTS "ColorDB";
CREATE DATABASE "ColorDB";

\c ColorDB;

DROP TYPE IF EXISTS project_status;
CREATE TYPE project_status AS ENUM ('incomplete', 'complete');


DROP TABLE IF EXISTS projects; 
CREATE TABLE projects (
    id SERIAL PRIMARY KEY, 
    name VARCHAR(100), 
    status project_status NOT NULL DEFAULT 'incomplete'
);

DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    password VARCHAR(100) NOT NULL,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE
);