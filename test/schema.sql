-- The production schema of the tables lib/intervals, lib/range and lib/true-up read, loaded into the tests' throwaway
-- PostgreSQL by test/postgres.ts. anton-tesla-api-ws owns these tables and changes them; regenerate after it does, on onyx:
--
--   pg_dump --schema-only --no-owner --no-privileges -t energy_interval -t battery_sample -t vehicle_interval \
--     -t charge_session -t weather_sample -t vehicle -t data -t meter_day -t meter_read -t rate_revision \
--     -t nsc_rate -t true_up_statement -t true_up_statement_cycle -t vpp_payout "$DATABASE_URL"
--
-- run as anton's backup job runs pg_dump (deploy/backup-database there), then drop pg_dump's \restrict and
-- \unrestrict lines. Dumped 2026-11-08, at anton-tesla-api-ws 86714a1.
--
-- PostgreSQL database dump
--


-- Dumped from database version 18.6 (Debian 18.6-1.pgdg13+2)
-- Dumped by pg_dump version 18.6

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
-- Name: data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.data (
    id integer NOT NULL,
    date character varying(30),
    billing_cycle character varying(6),
    solar_generated real,
    from_grid real,
    to_grid real,
    from_powerwall real,
    powerwall_from_grid real,
    powerwall_from_solar real,
    house_from_grid real,
    house_from_solar real,
    house_from_powerwall real,
    total_house_usage real,
    battery_percentage integer,
    battery_status character varying(11),
    load_power real,
    solar_power real,
    grid_power real,
    battery_power real,
    created timestamp with time zone,
    modified timestamp with time zone,
    powerwall_to_grid double precision DEFAULT 0 NOT NULL,
    is_vpp boolean DEFAULT false NOT NULL
);


--
-- Name: data_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.data_id_seq OWNED BY public.data.id;


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
-- Name: meter_day; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meter_day (
    date character varying(10) NOT NULL,
    imported_wh integer NOT NULL,
    exported_wh integer NOT NULL,
    peak_imported_wh integer NOT NULL,
    peak_exported_wh integer NOT NULL
);


--
-- Name: meter_read; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meter_read (
    read_date date NOT NULL,
    year integer NOT NULL
);


--
-- Name: nsc_rate; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nsc_rate (
    month date NOT NULL,
    rate double precision NOT NULL
);


--
-- Name: rate_revision; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rate_revision (
    effective_date date NOT NULL,
    summer_peak_total double precision NOT NULL,
    summer_off_peak_total double precision NOT NULL,
    winter_peak_total double precision NOT NULL,
    winter_off_peak_total double precision NOT NULL,
    summer_peak_generation double precision NOT NULL,
    summer_off_peak_generation double precision NOT NULL,
    winter_peak_generation double precision NOT NULL,
    winter_off_peak_generation double precision NOT NULL,
    baseline_credit double precision NOT NULL,
    bundled_pcia double precision NOT NULL,
    vintage_pcia double precision NOT NULL,
    nbc double precision NOT NULL,
    summer_baseline_kwh double precision NOT NULL,
    winter_baseline_kwh double precision NOT NULL,
    minimum_delivery_daily double precision DEFAULT 0 NOT NULL
);


--
-- Name: true_up_statement; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.true_up_statement (
    true_up_end_year integer NOT NULL,
    nem_charges double precision NOT NULL,
    minimum_delivery double precision NOT NULL,
    amount_due double precision NOT NULL
);


--
-- Name: true_up_statement_cycle; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.true_up_statement_cycle (
    end_read date NOT NULL,
    true_up_end_year integer NOT NULL,
    net_peak_kwh double precision NOT NULL,
    net_off_peak_kwh double precision NOT NULL,
    net_kwh double precision NOT NULL,
    nem_charges double precision NOT NULL,
    minimum_delivery double precision NOT NULL
);


--
-- Name: true_up_statement_true_up_end_year_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.true_up_statement_true_up_end_year_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: true_up_statement_true_up_end_year_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.true_up_statement_true_up_end_year_seq OWNED BY public.true_up_statement.true_up_end_year;


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
-- Name: vpp_payout; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vpp_payout (
    season integer NOT NULL,
    amount double precision NOT NULL,
    paid_on date NOT NULL
);


--
-- Name: vpp_payout_season_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.vpp_payout_season_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: vpp_payout_season_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.vpp_payout_season_seq OWNED BY public.vpp_payout.season;


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
-- Name: data id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data ALTER COLUMN id SET DEFAULT nextval('public.data_id_seq'::regclass);


--
-- Name: true_up_statement true_up_end_year; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.true_up_statement ALTER COLUMN true_up_end_year SET DEFAULT nextval('public.true_up_statement_true_up_end_year_seq'::regclass);


--
-- Name: vpp_payout season; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vpp_payout ALTER COLUMN season SET DEFAULT nextval('public.vpp_payout_season_seq'::regclass);


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
-- Name: data data_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data
    ADD CONSTRAINT data_date_key UNIQUE (date);


--
-- Name: data data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data
    ADD CONSTRAINT data_pkey PRIMARY KEY (id);


--
-- Name: energy_interval energy_interval_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.energy_interval
    ADD CONSTRAINT energy_interval_pkey PRIMARY KEY (start_at);


--
-- Name: meter_day meter_day_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meter_day
    ADD CONSTRAINT meter_day_pkey PRIMARY KEY (date);


--
-- Name: meter_read meter_read_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meter_read
    ADD CONSTRAINT meter_read_pkey PRIMARY KEY (read_date);


--
-- Name: nsc_rate nsc_rate_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nsc_rate
    ADD CONSTRAINT nsc_rate_pkey PRIMARY KEY (month);


--
-- Name: rate_revision rate_revision_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rate_revision
    ADD CONSTRAINT rate_revision_pkey PRIMARY KEY (effective_date);


--
-- Name: true_up_statement_cycle true_up_statement_cycle_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.true_up_statement_cycle
    ADD CONSTRAINT true_up_statement_cycle_pkey PRIMARY KEY (end_read);


--
-- Name: true_up_statement true_up_statement_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.true_up_statement
    ADD CONSTRAINT true_up_statement_pkey PRIMARY KEY (true_up_end_year);


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
-- Name: vpp_payout vpp_payout_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vpp_payout
    ADD CONSTRAINT vpp_payout_pkey PRIMARY KEY (season);


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
-- Name: ix_meter_read_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_meter_read_year ON public.meter_read USING btree (year);


--
-- Name: ix_true_up_statement_cycle_true_up_end_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_true_up_statement_cycle_true_up_end_year ON public.true_up_statement_cycle USING btree (true_up_end_year);


--
-- PostgreSQL database dump complete
--


