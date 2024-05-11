DROP DATABASE IF EXISTS "ColorDB";
CREATE DATABASE "ColorDB";

\c ColorDB;

DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    password VARCHAR(100) NOT NULL
);

DROP TABLE IF EXISTS projects; 
CREATE TABLE projects (
    id SERIAL PRIMARY KEY, 
    name VARCHAR(100), 
    completed bool 
);