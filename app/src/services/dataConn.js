/**
 * @module DataConnection
 *
 * Create and check the connection for data persistence.
 * Default is Postgresql using Knex.
 *
 * @see EmailService
 *
 * @see Knex
 * @see Objection
 *
 *
 * @exports DataConnection
 */
const Knex = require('knex');
const knexfile = require('../../knexfile');
const log = require('npmlog');
const { Model } = require('objection');

class DataConnection {
  /**
   * Creates a new DataConnection with default (Postgresql) Knex configuration.
   * @class
   */
  constructor() {
    this.knex = Knex(knexfile);
  }

  /** @function connected
   *  True or false if connected.
   */
  get connected() {
    return this._connected;
  }

  /** @function knex
   *  Gets the current knex binding
   */
  get knex() {
    return this._knex;
  }

  /** @function knex
   *  Sets the current knex binding
   *  @param {object} v - a Knex object.
   */
  set knex(v) {
    this._knex = v;
    this._connected = false;
  }

  /** @function checkConnection
   *  Checks the current knex connection.
   *  Will check for expected schema tables and binds this knex to the Objection Models.
   */
  async checkConnection() {
    this._connected = false;
    let { connectOk, schemaOk, modelsOk } = false;
    try {
      const data = await this._knex.raw('SELECT 1+1 AS result');
      connectOk = (data && data.rows && data.rows[0].result === 2);
      if (connectOk) {
        log.debug('Database connection ok...');
        schemaOk = await Promise.all([
          this._knex.schema.hasTable('trxn'),
          this._knex.schema.hasTable('message'),
          this._knex.schema.hasTable('status'),
          this._knex.schema.hasTable('queue'),
          this._knex.schema.hasTable('statistic')
        ]).then(exists => exists.every(x => x));
      }
      if (schemaOk) {
        log.debug('Database schema ok...');
        Model.knex(this.knex);
        modelsOk = true;
        log.debug('Database models ok...');
      }
    } catch (err) {
      log.error(`Error initializing data connection: ${err.message}`);
      log.error(err);
    }
    log.info('Database', `Connect OK: ${connectOk}, Schema OK: ${schemaOk}, Models OK: ${modelsOk}`);
    this._connected = connectOk && schemaOk && modelsOk;
    return this._connected;
  }

}

module.exports = DataConnection;
