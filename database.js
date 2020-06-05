function database(){
  this.version = '0.0.1';
    var db = null;
    var mysql = require('mysql');
    var config = {
      host:'127.0.0.1',
      user: 'root',
      password: '',
      database: 'my_game'
    };

    this.connect = function(callback){
          db = mysql.createConnection(process.env.DATABASE_URL);
          db.connect(function(err){
            if (err){
              console.error("error connecting my sql: "+ err);
              return
            }
              console.log("Conected as database " + config.database);
              callback(err);
          });
        };//end this.conected

    this.lookForUser = function(user, callback){
      var sql = "SELECT * FROM counts WHERE user = " + mysql.escape(user);
      db.query(sql, function(err, rows){
        if (err){console.error(err);}
        callback(err,rows);
      });
    };//end this.lookForUser

    this.addUser = function(user, pass, callback){
      var sql = ("INSERT INTO counts ( `user`,`pass` ) VALUES (" + mysql.escape(user) + "," + mysql.escape(pass) + ")");
      db.query(sql,function(err,data){
        if (err){console.error(err);}
        callback(err,data);
      });
    };//end this.addUser

    this.verificUser = function(user,pass,callback){
      var sql = "SELECT * FROM counts WHERE user = "+ mysql.escape(user) + " AND pass = " + mysql.escape(pass);
      db.query(sql, function(err, rows){
        if (err){console.error(err);}
        if (rows[0]){
          callback(true);//existe usuario
        }else{
          callback(false);//nao existe usuario
        }
      });
    };//end this.verificUser

    //this.createUser = function(user,pass,callback){
    //  var sql = "INSERT INTO counts ( `user`,`pass` ) VALUES (" + mysql.escape(user) + "," + mysql.escape(pass) + ")";
    //  db.query(sql, function(err,data){
    //    if (err){console.error(err);}
      //  callback(err);
    //    console.log(err);
  //    });
  //  };//end this.createUser

  };
  module.exports = new database;
