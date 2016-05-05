module.exports = { 
    server: {
        simple: {
            log: {
              db: 'nba2_ope_db',
              host: '127.0.0.1',
              port: 27017
            },
            ope_config: {
              db: 'nba2',
              host: '127.0.0.1',
              port: 27017
            },
            game_db_android_backup: {
              db: 'game_db_',
              host: '127.0.0.1',
              port: 27017
            },
            login_db_android_backup: {
              db: 'login_db_',
              host: '127.0.0.1',
              port: 27017
            },
            game_db_ios_backup: {
              db: 'game_db_',
              host: '127.0.0.1',
              port: 27017
            },
            login_db_ios_backup: {
              db: 'login_db_',
              host: '127.0.0.1',
              port: 27017
            },
            game_db_android_slave: {
                game_db0: {
                    db: 'game_db',
                    host: 'nba2_mongod05',
                    port: 37017
                },
                game_db1: {
                    db: 'game_db',
                    host: 'nba2_mongod06',
                    port: 37017
                },
                game_db2: {
                    db: 'game_db',
                    host: 'nba2_mongod07',
                    port: 37017
                }
            },
            login_db_android_slave: {
                login_db0: {
                    db: 'login_db',
                    host: 'nba2_mongod05',
                    port: 27017
                },
                login_db1: {
                    db: 'login_db',
                    host: 'nba2_mongod06',
                    port: 27017
                },
                login_db2: {
                    db: 'login_db',
                    host: 'nba2_mongod07',
                    port: 27017
                }
            },
            game_db_ios_slave: {
                game_db0: {
                    db: 'game_db',
                    host: 'nba2_mongod09',
                    port: 37017
                },
                game_db1: {
                    db: 'game_db',
                    host: 'nba2_mongod10',
                    port: 37017
                },
                game_db2: {
                    db: 'game_db',
                    host: 'nba2_mongod11',
                    port: 37017
                },
            },
            login_db_ios_slave: {
                login_db0: {
                    db: 'login_db',
                    host: 'nba2_mongod09',
                    port: 27017
                },
                login_db1: {
                    db: 'login_db',
                    host: 'nba2_mongod10',
                    port: 27017
                },
                login_db2: {
                    db: 'login_db',
                    host: 'nba2_mongod11',
                    port: 27017
                }
            }
        },
        traditional_log: {
          db: 'nba2_ope_db',
          host: '127.0.0.1',
          port: 27017
        },
        traditional_ope_config: {
          db: 'nba2',
          host: '127.0.0.1',
          port: 27017
        },
        traditional_game_db_backup: {
          db: 'game_db',
          host: '10.1.70.249',
          port: 37017
        },
        traditional_login_db_backup: {
          db: 'login_db',
          host: '10.1.70.249',
          port: 27017
        },
        traditional_game_db_slave: {
            game_db0: {
                db: 'game_db',
                host: 'twnba2_mongod01',
                port: 37017
            },
            game_db1: {
                db: 'game_db',
                host: 'twnba2_mongod02',
                port: 37017
            },
            game_db2: {
                db: 'game_db',
                host: 'twnba2_mongod03',
                port: 37017
            },
        },
        traditional_login_db_slave: {
            login_db0: {
                db: 'login_db',
                host: 'twnba2_mongod01',
                port: 27017
            },
            login_db1: {
                db: 'login_db',
                host: 'twnba2_mongod02',
                port: 27017
            },
            login_db2: {
                db: 'login_db',
                host: 'twnba2_mongod03',
                port: 27017
            }
        }
    },
    email: {
        service: '163',
        port: 25,
        user: 'logTool@163.com',
        password: 'wototjpucrwnltbt'
    },
    area: 1
}; 

