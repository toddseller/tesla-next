-- The production schema of the tables lib/intervals reads, loaded into the tests' throwaway PostgreSQL by
-- test/postgres.ts. anton-tesla-api-ws owns these tables and changes them; regenerate after it does, on onyx:
--
--   pg_dump --schema-only --no-owner --no-privileges -t energy_interval -t battery_sample -t vehicle_interval \
--     -t charge_session -t weather_sample -t vehicle "$DATABASE_URL"
--
-- run as anton's backup job runs pg_dump (deploy/backup-database there), then drop pg_dump's \restrict and
-- \unrestrict lines. Dumped 2026-11-07, at anton-tesla-api-ws 9a61314.

--
-- PostgreSQL database dump
--


-- Dumped from database version 18.6 (Debian 18.6-1.pgdg13+2)
-- Dumped by pg_dump version 18.6 (Debian 18.6-1.pgdg13+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: battery_sample; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.battery_sample (
    sampled_at timestamp with time zone NOT NULL,
    percentage smallint NOT NULL,
    CONSTRAINT battery_sample_percentage_range CHECK (((percentage >= 1) AND (percentage <= 100)))
);


--
-- Name: charge_session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.charge_session (
    start_at timestamp with time zone NOT NULL,
    duration_s integer NOT NULL,
    energy_wh integer NOT NULL
);


--
-- Name: energy_interval; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.energy_interval (
    start_at timestamp with time zone NOT NULL,
    day date NOT NULL,
    solar_generated_wh integer NOT NULL,
    grid_imported_wh integer NOT NULL,
    grid_exported_from_solar_wh integer NOT NULL,
    grid_exported_from_battery_wh integer NOT NULL,
    battery_exported_wh integer NOT NULL,
    battery_imported_from_grid_wh integer NOT NULL,
    battery_imported_from_solar_wh integer NOT NULL,
    house_from_grid_wh integer NOT NULL,
    house_from_solar_wh integer NOT NULL,
    house_from_battery_wh integer NOT NULL
);


--
-- Name: vehicle; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehicle (
    vin character varying NOT NULL,
    display_name character varying NOT NULL,
    streamed boolean NOT NULL
);


--
-- Name: vehicle_interval; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehicle_interval (
    start_at timestamp with time zone NOT NULL,
    energy_wh integer NOT NULL,
    vin character varying(17)
);


--
-- Name: weather_sample; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.weather_sample (
    sampled_at timestamp with time zone NOT NULL,
    weather_code smallint NOT NULL,
    cloud_cover smallint NOT NULL,
    wind_speed smallint,
    wind_direction smallint,
    cloud_cover_low smallint,
    cloud_cover_mid smallint,
    cloud_cover_high smallint,
    airport_low smallint,
    airport_mid smallint,
    wind_low_speed smallint,
    wind_low_direction smallint,
    wind_mid_speed smallint,
    wind_mid_direction smallint,
    wind_high_speed smallint,
    wind_high_direction smallint
);


--
-- Name: battery_sample battery_sample_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.battery_sample
    ADD CONSTRAINT battery_sample_pkey PRIMARY KEY (sampled_at);


--
-- Name: charge_session charge_session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.charge_session
    ADD CONSTRAINT charge_session_pkey PRIMARY KEY (start_at);


--
-- Name: energy_interval energy_interval_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.energy_interval
    ADD CONSTRAINT energy_interval_pkey PRIMARY KEY (start_at);


--
-- Name: vehicle_interval vehicle_interval_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicle_interval
    ADD CONSTRAINT vehicle_interval_pkey PRIMARY KEY (start_at);


--
-- Name: vehicle vehicle_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicle
    ADD CONSTRAINT vehicle_pkey PRIMARY KEY (vin);


--
-- Name: weather_sample weather_sample_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weather_sample
    ADD CONSTRAINT weather_sample_pkey PRIMARY KEY (sampled_at);


--
-- Name: ix_energy_interval_day; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_energy_interval_day ON public.energy_interval USING btree (day);


--
-- PostgreSQL database dump complete
--


