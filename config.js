module.exports = {
  /**
   * only read by logger to mark system type while mailing
   * [local], [stage] or [prod]
   */
  systemType: '[local]',
  adminMail: 'divesh.naidu@collegedunia.com',
  mongoUri: 'mongodb://root:rootpw@localhost:27017/starter?authSource=admin',
  testMongoUri: 'mongodb://root:rootpw@localhost:27017/startertest?authSource=admin',
  basePort: 5000,
  apiVersion: 1,

  /** ************ Flags ***************** */

  /** ********* Connections  ************* */


  /** *********** Env Overrides ************** */

  $env_development: {},

  $env_test: {},

  $env_CI: {},

  $env_production: {},
};
