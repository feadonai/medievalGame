var express = require('express');

var app = express();

var http = require('http').Server(app);

var io = require('socket.io')(http);

var shortId = require('shortid');

var database = require('./database');
//Declaração bibliotecas a serem usadas.

database.connect(function(err_connect){});//Conecta a base de dados

var PlayersOnlline = {};
var roomFull = false;
var quantPlayers = 0;
io.on('connection', function(socket){
  console.log("Somebody conected ID: " + socket.id);
  var CurrentPlayer = {};

  socket.on("REGISTER", function(pack){
    database.lookForUser(pack.user, function(err, rows){
      if (err){
        console.log(err);
        var ret = {result: "erro"};
        socket.emit("REGISTER_RESULT", ret);
      }
      else if (rows.length > 0){
        console.log("user " + pack.user + " already exist");
        var ret = {result: "exist"};
        socket.emit("REGISTER_RESULT", ret);
      }
      else{
        console.log("creating new count: " + pack.user);
        database.addUser(pack.user, pack.password, function(err, data){
          if(err){
            console.log(err);
            var ret = {result: "erro"};
          }else{
            console.log("user " + pack.user + " was registered");
            var ret = {result: "succes"};
          }
          socket.emit("REGISTER_RESULT", ret);
        });
      }
    });
  });//end socket.on(REGISTER)

  socket.on("LOGIN", function(pack){
    database.verificUser(pack.user, pack.password, function(exist){
      if (exist){
        var userAlreadyOnlline = false;
        //if (CurrentPlayer.estate == "math" || CurrentPlayer.estate == "lobby"){
          for (key in PlayersOnlline){
            //console.log(PlayersOnlline[key].name + " user pack: " + pack.user);
            if (PlayersOnlline[key].nameUser == pack.user){
              userAlreadyOnlline = true;
            };
          };
          console.log("usuario ja onlline: " +userAlreadyOnlline);
        //}
        if (!roomFull){
          if (!userAlreadyOnlline){
            database.lookForUser(pack.user, function(err, rows){
              if(err){console.err(err)};
                CurrentPlayer = {
                  id: socket.id,
                  nameUser: pack.user, // ou user: rows[0].user
                  state: "lobby"
                  //canStart: "0"
                };
                PlayersOnlline[CurrentPlayer.id] = {
                  id: CurrentPlayer.id,
                  nameUser: CurrentPlayer.nameUser,
                  state: "lobby"
                  //canStart: "0"
                }
                console.log(CurrentPlayer.id);
                socket.emit("LOGIN_SUCCESS", CurrentPlayer);
                socket.broadcast.emit("PLAYER_JOIN", CurrentPlayer);
                quantPlayers = 0;
                for (key in PlayersOnlline){
                  quantPlayers++;
                  if (PlayersOnlline[key].id != CurrentPlayer.id){
                    socket.emit("PLAYER_JOIN", PlayersOnlline[key]);
                  };
                };
                if (quantPlayers >= 2){
                  roomFull = true;
                }else{roomFull = false;}
                console.log(CurrentPlayer.nameUser + " join on the loby. ESTATE: "+ CurrentPlayer.state);
                console.log("Player Onlline: " + quantPlayers);
            });
          }else{socket.emit("LOGIN_FAILED_USER_ALREADY_ONLINE");}
        }else{socket.emit("LOGIN_FAILED_ROOM_FULL");}
      }else if (!exist){socket.emit("LOGIN_FAILED");}
    });
  });//end socket.on(LOGIN)

  socket.on("START_GAME", function(pack){
    console.log("solicitação para iniciar jogo..." + pack.startGame);
    if(pack.startGame == "1"){
      PlayersOnlline[pack.id] = {
        id: PlayersOnlline[pack.id].id,
        nameUser: PlayersOnlline[pack.id].nameUser,
        state: "pre-lobby"
        //canStart: pack.startGame
      };
    }
    else if(pack.startGame == "0"){
      PlayersOnlline[pack.id] = {
        id: PlayersOnlline[pack.id].id,
        nameUser: PlayersOnlline[pack.id].nameUser,
        state: "lobby"
        //canStart: pack.startGame
      };
    }
    var numCanStart = 0;
    for (key in PlayersOnlline){
      if (PlayersOnlline[key].state == "pre-lobby"){
        numCanStart++;
      }
    }
    console.log(numCanStart + "/" + quantPlayers);
    if (numCanStart >= 2){
      //var numTerritorios = pack.numTerritorios;
      var numTerritorios = 16;//N PODE SER NOVE POIS SENAO DA NEGATIVO RANDOMNUMBER

      var randomNumber1 = Math.floor(Math.random()*10+ (numTerritorios-10));
      var randomNumber2 = Math.floor(Math.random()*10+ (numTerritorios-10));

      var ListaNumerosRandom = {
        num1: Math.floor(Math.random()*10+1),
        num2: Math.floor(Math.random()*10+1),
        num3: Math.floor(Math.random()*10+1),
        num4: Math.floor(Math.random()*10+1),
        num5: Math.floor(Math.random()*10+1),
        num6: Math.floor(Math.random()*10+1),
        num7: Math.floor(Math.random()*10+1),
        num8: Math.floor(Math.random()*10+1),
        num9: Math.floor(Math.random()*10+1),
        num10: Math.floor(Math.random()*10+1),
        num11: Math.floor(Math.random()*10+1),
        num12: Math.floor(Math.random()*10+1),
        num13: Math.floor(Math.random()*10+1),
        num14: Math.floor(Math.random()*10+1),
        num15: Math.floor(Math.random()*10+1),
        num16: Math.floor(Math.random()*10+1),
        num17: Math.floor(Math.random()*10+1),
        num18: Math.floor(Math.random()*10+1),
        num19: Math.floor(Math.random()*10+1),
        num20: Math.floor(Math.random()*10+1),
        num21: Math.floor(Math.random()*10+1),
        num22: Math.floor(Math.random()*10+1),
        num23: Math.floor(Math.random()*10+1),
        num24: Math.floor(Math.random()*10+1),
        num25: Math.floor(Math.random()*10+1)
      }
      var ListaProducao = {
        TipoProducao1: Math.floor(Math.random()*10+1),
        TipoProducao2: Math.floor(Math.random()*10+1),
        TipoProducao3: Math.floor(Math.random()*10+1),
        TipoProducao4: Math.floor(Math.random()*10+1),
        TipoProducao5: Math.floor(Math.random()*10+1),
        TipoProducao6: Math.floor(Math.random()*10+1),
        TipoProducao7: Math.floor(Math.random()*10+1),
        TipoProducao8: Math.floor(Math.random()*10+1),
        TipoProducao9: Math.floor(Math.random()*10+1),
        TipoProducao10: Math.floor(Math.random()*10+1),
        TipoProducao11: Math.floor(Math.random()*10+1),
        TipoProducao12: Math.floor(Math.random()*10+1),
        TipoProducao13: Math.floor(Math.random()*10+1),
        TipoProducao14: Math.floor(Math.random()*10+1),
        TipoProducao15: Math.floor(Math.random()*10+1),
        TipoProducao16: Math.floor(Math.random()*10+1),
        TipoProducao17: Math.floor(Math.random()*10+1),
        TipoProducao18: Math.floor(Math.random()*10+1),
        TipoProducao19: Math.floor(Math.random()*10+1),
        TipoProducao20: Math.floor(Math.random()*10+1),
        TipoProducao21: Math.floor(Math.random()*10+1),
        TipoProducao22: Math.floor(Math.random()*10+1),
        TipoProducao23: Math.floor(Math.random()*10+1),
        TipoProducao24: Math.floor(Math.random()*10+1),
        TipoProducao25: Math.floor(Math.random()*10+1)
      }
      var ListaDecrescimoProducao = {
        decrescimoProducao1: Math.floor(Math.random()*10+1),
        decrescimoProducao2: Math.floor(Math.random()*10+1),
        decrescimoProducao3: Math.floor(Math.random()*10+1),
        decrescimoProducao4: Math.floor(Math.random()*10+1),
        decrescimoProducao5: Math.floor(Math.random()*10+1),
        decrescimoProducao6: Math.floor(Math.random()*10+1),
        decrescimoProducao7: Math.floor(Math.random()*10+1),
        decrescimoProducao8: Math.floor(Math.random()*10+1),
        decrescimoProducao9: Math.floor(Math.random()*10+1),
        decrescimoProducao10: Math.floor(Math.random()*10+1),
        decrescimoProducao11: Math.floor(Math.random()*10+1),
        decrescimoProducao12: Math.floor(Math.random()*10+1),
        decrescimoProducao13: Math.floor(Math.random()*10+1),
        decrescimoProducao14: Math.floor(Math.random()*10+1),
        decrescimoProducao15: Math.floor(Math.random()*10+1),
        decrescimoProducao16: Math.floor(Math.random()*10+1),
        decrescimoProducao17: Math.floor(Math.random()*10+1),
        decrescimoProducao18: Math.floor(Math.random()*10+1),
        decrescimoProducao19: Math.floor(Math.random()*10+1),
        decrescimoProducao20: Math.floor(Math.random()*10+1),
        decrescimoProducao21: Math.floor(Math.random()*10+1),
        decrescimoProducao22: Math.floor(Math.random()*10+1),
        decrescimoProducao23: Math.floor(Math.random()*10+1),
        decrescimoProducao24: Math.floor(Math.random()*10+1),
        decrescimoProducao25: Math.floor(Math.random()*10+1)
      }
      var ListaBonusProducao = {
        bonusProducao1: Math.floor(Math.random()*10+1),
        bonusProducao2: Math.floor(Math.random()*10+1),
        bonusProducao3: Math.floor(Math.random()*10+1),
        bonusProducao4: Math.floor(Math.random()*10+1),
        bonusProducao5: Math.floor(Math.random()*10+1),
        bonusProducao6: Math.floor(Math.random()*10+1),
        bonusProducao7: Math.floor(Math.random()*10+1),
        bonusProducao8: Math.floor(Math.random()*10+1),
        bonusProducao9: Math.floor(Math.random()*10+1),
        bonusProducao10: Math.floor(Math.random()*10+1),
        bonusProducao11: Math.floor(Math.random()*10+1),
        bonusProducao12: Math.floor(Math.random()*10+1),
        bonusProducao13: Math.floor(Math.random()*10+1),
        bonusProducao14: Math.floor(Math.random()*10+1),
        bonusProducao15: Math.floor(Math.random()*10+1),
        bonusProducao16: Math.floor(Math.random()*10+1),
        bonusProducao17: Math.floor(Math.random()*10+1),
        bonusProducao18: Math.floor(Math.random()*10+1),
        bonusProducao19: Math.floor(Math.random()*10+1),
        bonusProducao20: Math.floor(Math.random()*10+1),
        bonusProducao21: Math.floor(Math.random()*10+1),
        bonusProducao22: Math.floor(Math.random()*10+1),
        bonusProducao23: Math.floor(Math.random()*10+1),
        bonusProducao24: Math.floor(Math.random()*10+1),
        bonusProducao25: Math.floor(Math.random()*10+1)
      }
      while (randomNumber2 == randomNumber1){
        randomNumber2 = Math.floor(Math.random()*10 + (numTerritorios-10));
      }
      var index = 0;
      for (key in PlayersOnlline){
        index++;
        if (index == 1){
          PlayersOnlline[key]={
            id: PlayersOnlline[key].id,
            nameUser: PlayersOnlline[key].nameUser,
            state: "math",
            //canStart: "1",
            tag: index,
            territorio: randomNumber1,
          };
          console.log(PlayersOnlline[key].nameUser + ":player1");
        }else if (index == 2){
          PlayersOnlline[key]={
            id: PlayersOnlline[key].id,
            nameUser: PlayersOnlline[key].nameUser,
            state: "math",
            //canStart: "1",
            tag: index,
            territorio: randomNumber2,
          };
          console.log(PlayersOnlline[key].nameUser + ":player2");
        }
        PlayersOnlline[key]={
          id: PlayersOnlline[key].id,
          nameUser: PlayersOnlline[key].nameUser,
          state: PlayersOnlline[key].state,
          //canStart: PlayersOnlline[key].canStart,
          tag: PlayersOnlline[key].tag,
          numTerritorios: numTerritorios,
          territorio: PlayersOnlline[key].territorio,
          num1: ListaNumerosRandom.num1,
          num2: ListaNumerosRandom.num2,
          num3: ListaNumerosRandom.num3,
          num4: ListaNumerosRandom.num4,
          num5: ListaNumerosRandom.num5,
          num6: ListaNumerosRandom.num6,
          num7: ListaNumerosRandom.num7,
          num8: ListaNumerosRandom.num8,
          num9: ListaNumerosRandom.num9,
          num10: ListaNumerosRandom.num10,
          num11: ListaNumerosRandom.num11,
          num12: ListaNumerosRandom.num12,
          num13: ListaNumerosRandom.num13,
          num14: ListaNumerosRandom.num14,
          num15: ListaNumerosRandom.num15,
          num16: ListaNumerosRandom.num16,
          num17: ListaNumerosRandom.num17,
          num18: ListaNumerosRandom.num18,
          num19: ListaNumerosRandom.num19,
          num20: ListaNumerosRandom.num20,
          num21: ListaNumerosRandom.num21,
          num21: ListaNumerosRandom.num21,
          num22: ListaNumerosRandom.num22,
          num23: ListaNumerosRandom.num23,
          num24: ListaNumerosRandom.num24,
          num25: ListaNumerosRandom.num25,


          TipoProducao1: ListaProducao.TipoProducao1,
          TipoProducao2: ListaProducao.TipoProducao2,
          TipoProducao3: ListaProducao.TipoProducao3,
          TipoProducao4: ListaProducao.TipoProducao4,
          TipoProducao5: ListaProducao.TipoProducao5,
          TipoProducao6: ListaProducao.TipoProducao6,
          TipoProducao7: ListaProducao.TipoProducao7,
          TipoProducao8: ListaProducao.TipoProducao8,
          TipoProducao9: ListaProducao.TipoProducao9,
          TipoProducao10: ListaProducao.TipoProducao10,
          TipoProducao11: ListaProducao.TipoProducao11,
          TipoProducao12: ListaProducao.TipoProducao12,
          TipoProducao13: ListaProducao.TipoProducao13,
          TipoProducao14: ListaProducao.TipoProducao14,
          TipoProducao15: ListaProducao.TipoProducao15,
          TipoProducao16: ListaProducao.TipoProducao16,
          TipoProducao17: ListaProducao.TipoProducao17,
          TipoProducao18: ListaProducao.TipoProducao18,
          TipoProducao19: ListaProducao.TipoProducao19,
          TipoProducao20: ListaProducao.TipoProducao20,
          TipoProducao21: ListaProducao.TipoProducao21,
          TipoProducao22: ListaProducao.TipoProducao22,
          TipoProducao23: ListaProducao.TipoProducao23,
          TipoProducao24: ListaProducao.TipoProducao24,
          TipoProducao25: ListaProducao.TipoProducao25,

          BonusProducao1: ListaBonusProducao.bonusProducao1,
          BonusProducao2:ListaBonusProducao.bonusProducao2,
          BonusProducao3:ListaBonusProducao.bonusProducao3,
          BonusProducao4:ListaBonusProducao.bonusProducao4,
          BonusProducao5:ListaBonusProducao.bonusProducao5,
          BonusProducao6:ListaBonusProducao.bonusProducao6,
          BonusProducao7:ListaBonusProducao.bonusProducao7,
          BonusProducao8:ListaBonusProducao.bonusProducao8,
          BonusProducao9:ListaBonusProducao.bonusProducao9,
          BonusProducao10:ListaBonusProducao.bonusProducao10,
          BonusProducao11: ListaBonusProducao.bonusProducao11,
          BonusProducao12:ListaBonusProducao.bonusProducao12,
          BonusProducao13:ListaBonusProducao.bonusProducao13,
          BonusProducao14:ListaBonusProducao.bonusProducao14,
          BonusProducao15:ListaBonusProducao.bonusProducao15,
          BonusProducao16:ListaBonusProducao.bonusProducao16,
          BonusProducao17:ListaBonusProducao.bonusProducao17,
          BonusProducao18:ListaBonusProducao.bonusProducao18,
          BonusProducao19:ListaBonusProducao.bonusProducao19,
          BonusProducao20:ListaBonusProducao.bonusProducao20,
          BonusProducao21: ListaBonusProducao.bonusProducao21,
          BonusProducao22:ListaBonusProducao.bonusProducao22,
          BonusProducao23:ListaBonusProducao.bonusProducao23,
          BonusProducao24:ListaBonusProducao.bonusProducao24,
          BonusProducao25:ListaBonusProducao.bonusProducao25,

          DecrescimoProducao1: ListaDecrescimoProducao.decrescimoProducao1,
          DecrescimoProducao2: ListaDecrescimoProducao.decrescimoProducao2,
          DecrescimoProducao3: ListaDecrescimoProducao.decrescimoProducao3,
          DecrescimoProducao4: ListaDecrescimoProducao.decrescimoProducao4,
          DecrescimoProducao5: ListaDecrescimoProducao.decrescimoProducao5,
          DecrescimoProducao6: ListaDecrescimoProducao.decrescimoProducao6,
          DecrescimoProducao7: ListaDecrescimoProducao.decrescimoProducao7,
          DecrescimoProducao8: ListaDecrescimoProducao.decrescimoProducao8,
          DecrescimoProducao9: ListaDecrescimoProducao.decrescimoProducao9,
          DecrescimoProducao10: ListaDecrescimoProducao.decrescimoProducao10,
          DecrescimoProducao11: ListaDecrescimoProducao.decrescimoProducao11,
          DecrescimoProducao12: ListaDecrescimoProducao.decrescimoProducao12,
          DecrescimoProducao13: ListaDecrescimoProducao.decrescimoProducao13,
          DecrescimoProducao14: ListaDecrescimoProducao.decrescimoProducao14,
          DecrescimoProducao15: ListaDecrescimoProducao.decrescimoProducao15,
          DecrescimoProducao16: ListaDecrescimoProducao.decrescimoProducao16,
          DecrescimoProducao17: ListaDecrescimoProducao.decrescimoProducao17,
          DecrescimoProducao18: ListaDecrescimoProducao.decrescimoProducao18,
          DecrescimoProducao19: ListaDecrescimoProducao.decrescimoProducao19,
          DecrescimoProducao20: ListaDecrescimoProducao.decrescimoProducao20,
          DecrescimoProducao21: ListaDecrescimoProducao.decrescimoProducao21,
          DecrescimoProducao22: ListaDecrescimoProducao.decrescimoProducao22,
          DecrescimoProducao23: ListaDecrescimoProducao.decrescimoProducao23,
          DecrescimoProducao24: ListaDecrescimoProducao.decrescimoProducao24,
          DecrescimoProducao25: ListaDecrescimoProducao.decrescimoProducao25
        };
        socket.emit("START_GAME_SUCCES", PlayersOnlline[key]);
        socket.broadcast.emit("START_GAME_SUCCES", PlayersOnlline[key]);
        }
    }else{
      for (key in PlayersOnlline){
        socket.emit("START_GAME_FAILED", PlayersOnlline[key]);
        socket.broadcast.emit("START_GAME_FAILED", PlayersOnlline[key]);
      }
    }
  });//end socket.on(START_GAME)

  socket.on("SOLICITAR_DADOS", function(pack){
    console.log("pegando dados");
    var solicitarDados = {
      idPlayerWant: pack.idWant,
      idPlayerGive: pack.idGive,
      index: pack.index
    }

    console.log("dados a serem enviados" + solicitarDados);
    socket.broadcast.emit("PEGAR_DADOS",solicitarDados)
  });//end socket.on(REQUIRE_DADOS)

  socket.on("ENVIAR_DADOS", function(pack){
    console.log("enviar dados");
    var enviarDados = {
      idPara: pack.idPara,
      idDe: pack.idDe,
      index: pack.index,
      money: pack.money,
      bread: pack.bread,
      attackPower: pack.attackPower,
      defencePower: pack.defencePower,
      a1: pack.a1,
      a2: pack.a2,
      d1: pack.d1,
      d2: pack.d2
    }
    console.log("ENVIANDO Dados");
    socket.broadcast.emit("DADOS_ENVIADOS",enviarDados)
  });//end socket.on(REQUIRE_DADOS)

  socket.on("ENVIAR_DADOS_BATALHA", function(pack){

    var enviarDados = {
      idDe: pack.idDe,
      indexDefesa: pack.indexDefesa,
      indexAtaque: pack.indexAtaque,
      newTag : pack.newTag,
      newName : pack.newName,
      isCaptura : pack.isCaptura,
      isVitoria : pack.isVitoria,
      attackPower : pack.attackPower,
      a1Ant : pack.a1Ant,
      a2Ant : pack.a2Ant,
      d1Ant : pack.d1Ant,
      d2Ant : pack.d2Ant,
      a1 : pack.a1,
      a2 : pack.a2,
      d1 : pack.d1,
      d2 : pack.d2,
      money : pack.money,
      bread : pack.bread
    }
    console.log("ENVIANDO DADOS BATALHA PARA tds  por " + enviarDados.idDe);
    socket.broadcast.emit("DADOS_ENVIADOS_BATALHA",enviarDados)
  });//end socket.on(REQUIRE_DADOS_BATALHA)

  socket.on("ENVIAR_DADOS_CAPTURA", function(pack){

    var enviarDados = {
      indexPara: pack.indexPara,
      levelFazenda: pack.levelFazenda,
      levelImpostos : pack.levelImpostos,
      levelArmazemFazenda : pack.levelArmazemFazenda,
      levelArmazemImposto : pack.levelArmazemImposto,
      levelEspiao : pack.levelEspiao
    }

    socket.broadcast.emit("DADOS_ENVIADOS_CAPTURA",enviarDados)
  });//end socket.on(REQUIRE_DADOS_BATALHA)
  socket.on("ACTION_MAP", function(pack){
    //console.log("Action map");
    var enviarDadosMap = {
      indexDe: pack.indexDe,
      indexPara: pack.indexPara,
      timeTrip: pack.timeTrip,
      tagPrefab: pack.tagPrefab,
      posX: pack.posX,
      posY: pack.posY,
      posZ: pack.posZ,
      attackPower: pack.attackPower,
      defencePower: pack.defencePower,
      a1: pack.a1,
      a2: pack.a2,
      d1: pack.d1,
      d2: pack.d2,
      money: pack.money,
      bread: pack.bread,
      ramdomNumber: pack.ramdomNumber
    }
    socket.broadcast.emit("ACTION_MAP_RESULT", enviarDadosMap);
  });//end ACTION_MAP
  socket.on("disconnect", function(){
    roomFull = false;
    if (CurrentPlayer.state == "math" || CurrentPlayer.state == "lobby" || CurrentPlayer.state == "pre-lobby"){
      quantPlayers--;
      console.log("Player Onlline: " + quantPlayers);
      for (key in PlayersOnlline){
        if (PlayersOnlline[key].id == socket.id){
          if (PlayersOnlline[key].state == "lobby" || PlayersOnlline[key].state == "pre-lobby"){
            socket.broadcast.emit("DISCONECTED_PLAYER_ON_LOBBY", PlayersOnlline[key]);
          }else if (PlayersOnlline[key].state == "math"){
            socket.broadcast.emit("DISCONECTED_PLAYER_ON_MATH", PlayersOnlline[key]);
          }
          console.log("Player disconnect: "+ PlayersOnlline[key].nameUser + " ESTATE: " + PlayersOnlline[key].state);
          delete PlayersOnlline[key];
        };
      };
    }else{console.log(socket.id + " disconected");}
  });//end socket.on(disconnect)

});//end io.on(concection)



http.listen(process.env.PORT || 3000, function(){
  console.log("server listen in 3000");
});
  console.log("-----------------------server is running-----------------------");
