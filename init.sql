DROP DATABASE IF EXISTS "MyDB";
CREATE DATABASE "MyDB";

\c MyDB;

DROP TABLE IF EXISTS table_name;
CREATE TABLE table_name (
    id SERIAL PRIMARY KEY,
);