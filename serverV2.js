var express = require('express');

var app = express();

var http = require('http').Server(app);

var io = require('socket.io')(http);

var shortId = require('shortid');

var database = require('./database');

database.connect(function(err_connect){});//Conecta a base de dados
//-----------------INICIO-VARIAVEIS---------------------------
var Ataques = {};
var PlayersOnlline = {};
var Territorios = {};
var maxPlayers = 2;
var stateGame = "off";
var NumTerritorios = 16;
//-----------------FIM-VARIAVEIS---------------------------

io.on('connection', function(socket){
  console.log("Somebody conected ID: " + socket.id);
  var CurrentPlayer = {};
  CurrentPlayer.id = socket.id;

//-----------------INICIO-lOGIN---------------------------
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

socket.emit("SEND_NAME_PLAYER",CurrentPlayer);
socket.on("NAME_USER", function(pack){
    if (pack.nameUser != ""){
      console.log("user ja conectado antes, name: " + pack.nameUser);
      if (!reconectUserAlreadyOnMath(pack.nameUser)){
        console.log("algo deu errado, desconectando " + pack.nameUser);
        socket.emit("EXIT_GAME_ERROR",CurrentPlayer);
      }
    }
    console.log("new user");
  })

socket.on("LOGIN", function(pack){
    console.log("tentativa de LOGIN por : " + pack.user);
    database.verificUser(pack.user, pack.password, function(exist){
        if (exist){
            if (quantPlayersGeral() < maxPlayers){
              if (!lookUserOnlline(pack.user)){
                database.lookForUser(pack.user, function(err, rows){
                  if(err){console.err(err)}
                  else{
                    stateGame = "lobby"
                    CurrentPlayer = {
                      id: socket.id,
                      nameUser: pack.user,
                      state: "lobby"
                    }
                    PlayersOnlline[CurrentPlayer.id] = {
                      id: CurrentPlayer.id,
                      nameUser: pack.user,
                      state: "lobby"
                    }
                    socket.emit("LOGIN_SUCCESS", CurrentPlayer);
                    socket.broadcast.emit("PLAYER_JOIN", CurrentPlayer);

                    for (key in PlayersOnlline){
                      if (PlayersOnlline[key].id != CurrentPlayer.id){
                        socket.emit("PLAYER_JOIN", PlayersOnlline[key]);
                        console.log(PlayersOnlline[key].nameUser + " esta na sala: "+ PlayersOnlline[key].state);
                      }else{
                        console.log(PlayersOnlline[key].nameUser + " (acabou de logar) esta na sala: " + PlayersOnlline[key].state);
                      }
                    }//define quantidade de players onlline e informa o plçayer outros plçayers
                    console.log("fim tentativa de LOGIN com sucesso");
                    console.log("quantPlayersGeral: " + quantPlayersGeral())
                    console.log("quantPlayersOn: " + quantPlayersOn())
                  }
                })
              }else if (lookUserOnlline(pack.user)){
                if (!isThisUserTryingReconect(pack.user)){socket.emit("LOGIN_FAILED_USER_ALREADY_ONLINE")}
              }//USER ALREADY ON
            }else if (quantPlayersGeral() >= maxPlayers){
              if(quantPlayersOn() >= maxPlayers){
                socket.emit("LOGIN_FAILED_ROOM_FULL")
              }else{
                if (!isThisUserTryingReconect(pack.user)){socket.emit("LOGIN_FAILED_ROOM_FULL")}
              }
            }//ROOM FULL
        }else if (!exist){
          console.log("o usuario " + pack.user + " nao existe");
          socket.emit("LOGIN_FAILED")
          console.log("fim LOGIN: FALHA para " + pack.user);
        }
    })

  })

function quantPlayersGeral(){
    var quantPlayers = 0;
    for (key4 in PlayersOnlline){
      quantPlayers++;
    }
    return quantPlayers
  }
function quantPlayersOn(){
    var quantPlayers2 = 0;
    for (key3 in PlayersOnlline){
      if (PlayersOnlline[key3].state != "off"){quantPlayers2++;}
    }
    return quantPlayers2
  }
function lookUserOnlline(nameUser){
    var userAlreadyOnlline = false;
    for (key in PlayersOnlline){
      if (PlayersOnlline[key].nameUser == nameUser){
        userAlreadyOnlline = true;
      }
    }
    return userAlreadyOnlline
  }
function isThisUserTryingReconect(userName){
    console.log("inico tenativa de tryReconectPlayer para " + userName)
    console.log("quantPlayersGeral: " + quantPlayersGeral())
    console.log("quantPlayersOn: " + quantPlayersOn())
    var wasOFF = false;
    console.log("estado game: " + stateGame);
    if(stateGame == "math"){
      for (key in PlayersOnlline){
        if (PlayersOnlline[key].nameUser == userName && PlayersOnlline[key].state == "off"){
          console.log(PlayersOnlline[key].nameUser + " esta reconectando na partida");
          wasOFF = true;
          PlayersOnlline[CurrentPlayer.id] = {
            state: "math",
            id: CurrentPlayer.id,
            nameUser:  userName,
            tag: PlayersOnlline[key].tag
          }
          delete(PlayersOnlline[key])
          socket.emit("LOGIN_SUCCESS", PlayersOnlline[CurrentPlayer.id]);
          for (key2 in PlayersOnlline){
            if (PlayersOnlline[key2].id != CurrentPlayer.id){
              socket.emit("PLAYER_JOIN", PlayersOnlline[key2]);
            }
          }
          socket.broadcast.emit("RECONECTED_PLAYER_ON_MATH", PlayersOnlline[CurrentPlayer.id]);
          for (var i = 0; i < Territorios[0].numTerritorios; i ++){
            console.log("territorio[" + Territorios[i].numTerritorios + "] tipo: " + Territorios[i].tipo + " pos = " + Territorios[i].index);
            socket.emit("LOGIN_SUCCESS_MATH", Territorios[i]);
          }
          console.log(userName + " reconectado com sucesso");
        }
      }
    }
    console.log("fim tenativa de tryReconectPlayer: " + wasOFF + " para " + userName);
    console.log("quantPlayersGeral: " + quantPlayersGeral())
    console.log("quantPlayersOn: " + quantPlayersOn())
    return wasOFF
  }
function reconectUserAlreadyOnMath(userName){
    console.log("inico tenativa de reconectUserAlreadyOnMath para " + userName)
    console.log("quantPlayersGeral: " + quantPlayersGeral())
    console.log("quantPlayersOn: " + quantPlayersOn())
    var wasOFF = false;
    if(stateGame == "math"){
      for (key in PlayersOnlline){
        if (PlayersOnlline[key].nameUser == userName && PlayersOnlline[key].state == "off"){
          console.log(PlayersOnlline[key].nameUser + " esta reconectando na partida");
          wasOFF = true;
          CurrentPlayer = {
            id: socket.id,
            nameUser: userName,
            state: "math"
          }
          PlayersOnlline[CurrentPlayer.id] = {
            state: "math",
            id: CurrentPlayer.id,
            nameUser:  userName,
            tag: PlayersOnlline[key].tag
          }
          delete(PlayersOnlline[key])
          socket.broadcast.emit("RECONECTED_PLAYER_ON_MATH", PlayersOnlline[CurrentPlayer.id]);
          for (var i = 0; i < Territorios[0].numTerritorios; i ++){
            console.log("territorio[" + Territorios[i].numTerritorios + "] tipo: " + Territorios[i].tipo + " pos = " + Territorios[i].index);
            socket.emit("LOGIN_SUCCESS_MATH", Territorios[i]);
          }
          console.log(userName + " reconectado com sucesso");
        }
      }
    }
    console.log("fim tenativa de tryReconectPlayer: " + wasOFF + " para " + userName);
    console.log("quantPlayersGeral: " + quantPlayersGeral())
    console.log("quantPlayersOn: " + quantPlayersOn())
    return wasOFF
  }
//-----------------FIM-lOGIN---------------------------
//-----------------INICIO-GAME---------------------------
socket.on("TRY_START_GAME", function(pack){
  //atualiza os estatos do cliente lobby/pre-lobby
  console.log("try start game");
  if(pack.startGame == "1"){PlayersOnlline[CurrentPlayer.id].state = "pre-lobby"}
  else if(pack.startGame == "0"){PlayersOnlline[CurrentPlayer.id].state = "lobby"}
  //conta quantos clientes podem começar o jogo
  var numCanStart = 0;
  for (key in PlayersOnlline){
    if (PlayersOnlline[key].state == "pre-lobby"){numCanStart++;}
  }
  console.log(numCanStart + "/" + maxPlayers);
  //fim atualiza estatos clientes

  if (numCanStart >= maxPlayers){
    console.log("iniciando...");
    var numTerritorios = NumTerritorios;//trocar dado para ser pego via cliente
    //define todos os numeros aleatorios (entre 1 e 10) a serem utilizados na distribuição dos territorios
    var randomNumber1 = Math.floor(Math.random()*10+ (numTerritorios-10));
    var randomNumber2 = Math.floor(Math.random()*10+ (numTerritorios-10));
    var ListaNumerosRandom = {};
    for (var i = 0; i < numTerritorios; i ++){
      ListaNumerosRandom[i] = Math.floor(Math.random()*10+1);
    }
    var ListaProducao = {};
    for (var i = 0; i < numTerritorios; i ++){
      ListaProducao[i] = Math.floor(Math.random()*10+1);
    }
    var ListaDecrescimoProducao = {};
    for (var i = 0; i < numTerritorios; i ++){
      ListaDecrescimoProducao[i] = Math.floor(Math.random()*10+1);
    }
    var ListaBonusProducao = {};
    for (var i = 0; i < numTerritorios; i ++){
      ListaBonusProducao[i] = Math.floor(Math.random()*10+1);
    }
    while (randomNumber2 == randomNumber1){randomNumber2 = Math.floor(Math.random()*10 + (numTerritorios-10));}//força randomNumber1 != randomNumber2
    //fim da declaração dos numeros aleatorios

    //inicio distribuiçao dos territorios e tags players
    console.log("gerando territorios...");
    for (var i = 0; i < numTerritorios; i ++){
      if (ListaNumerosRandom[i] <= 4){//40% para fazenda
        var tipoProducao = "comida";
        if (ListaProducao[i] >= 5){
          tipoProducao = "comida" //define como comida(50%)
        }else if (ListaProducao[i] < 5){
          tipoProducao = "moeda";
        }//define comoo moeda(50%)
        var bonus = 1;
        if (Math.round(ListaBonusProducao[i] / 2) == 0){
          bonus = 1;
        }else if (1==1){
          bonus = Math.round(ListaBonusProducao[i] / 2)
        }
        var decrescimo =1;
        if (Math.round(ListaDecrescimoProducao[i] /3) == 0){
          decrescimo = 1;
        }else if (1 ==1){
          decrescimo = Math.round(ListaDecrescimoProducao[i] / 3);
        }
        var defence = (((bonus*2)-decrescimo)*100 <= 0);
        if (defence <= 0){
          defence = 100;
        }
        Territorios[i] = {
          numTerritorios: numTerritorios,
          tipo: "bot",
          index: i,
          tag: "fazenda",
          tagUser: "",
          nameUser: "",
          IDuser: "",
          state: "",
          nameTerritorio: ("fazenda " + (i+1)),

          a1: "",
          a2: "",
          d1: "",
          d2: "",
          attack: "",
          defence: defence,
          money: "",
          bread: "",
          levelFazenda: "",
          levelInposto: "",
          levelArmazemComida: "",
          levelArmazemMoeda: "",
          levelEspiao: "",
          tipoProducao: tipoProducao,
          bonusProducao: bonus,
          decrescimoProducao: decrescimo
        }//define territorio[i] como fazenda e seta sua propriedades
      }
      else if ((ListaNumerosRandom[i] > 4) && (ListaNumerosRandom[i] <= 7)){//30% para neutro
        var moeda = (Math.floor(Math.random()*10+1) * 100)
        var bread = (Math.floor(Math.random()*10+1) * 100)
        var defesa = ((moeda + bread) * 2)
        Territorios[i] = {
          numTerritorios: numTerritorios,
          tipo: "bot",
          index: i,
          tag: "neutro",
          tagUser: "",
          nameUser: "",
          IDuser: "",
          state: "",
          nameTerritorio: ("neutro " + (i+1)),

          a1: "",
          a2: "",
          d1: "",
          d2: "",
          attack: 0,
          defence: defesa,
          money: moeda,
          bread: bread,
          levelFazenda: "",
          levelInposto: "",
          levelArmazemComida: "",
          levelArmazemMoeda: "",
          levelEspiao: "",
          tipoProducao: "",
          bonusProducao: "",
          decrescimoProducao: ""
        };
      }
      else if (ListaNumerosRandom[i] > 7){//30% para sem dono
        var moeda = Math.floor(Math.random()*10+1) * 10;
        var bread = Math.floor(Math.random()*10+1) * 10;
        var defesa = (moeda + bread) * 3;
        Territorios[i] = {
          numTerritorios: numTerritorios,
          tipo: "bot",
          index: i,
          tag: "semDono",
          tagUser: "",
          nameUser: "",
          IDuser: "",
          state: "",
          nameTerritorio: ("Sem Dono " + (i+1)),

          a1: "",
          a2: "",
          d1: "",
          d2: "",
          attack: "",
          defence: defesa,
          money: moeda,
          bread: bread,
          levelFazenda: 0,
          levelInposto: 0,
          levelArmazemComida: 0,
          levelArmazemMoeda: 0,
          levelEspiao: 0,
          tipoProducao: "",
          bonusProducao: "",
          decrescimoProducao: ""}}}//define tds as propriedades dos territorios
    var index = 0;
    for (key in PlayersOnlline){
      index++;
      PlayersOnlline[key].state = "math"
      PlayersOnlline[key].tag = index
      if (index == 1){
        Territorios[randomNumber1] = {
          numTerritorios: numTerritorios,
          tipo: "player",
          index: randomNumber1,
          tag: "player1",
          tagUser: "player1",
          nameUser: PlayersOnlline[key].nameUser,
          IDuser: PlayersOnlline[key].id,
          state: "math",
          nameTerritorio: PlayersOnlline[key].nameUser,

          a1: 0,
          a2: 0,
          d1: 0,
          d2: 0,
          attack: 0,
          defence: 0,
          money: 50,
          bread: 50,
          levelFazenda: 1,
          levelInposto: 1,
          levelArmazemComida: 1,
          levelArmazemMoeda: 1,
          levelEspiao: 0,
          tipoProducao: "",
          bonusProducao: "",
          decrescimoProducao: ""
        }
      }else if (index == 2){
        Territorios[randomNumber2] = {
          numTerritorios: numTerritorios,
          tipo: "player",
          index: randomNumber2,
          tag: "player2",
          tagUser: "player2",
          nameUser: PlayersOnlline[key].nameUser,
          IDuser: PlayersOnlline[key].id,
          state: "math",
          nameTerritorio: PlayersOnlline[key].nameUser,

          a1: 0,
          a2: 0,
          d1: 0,
          d2: 0,
          attack: 0,
          defence: 0,
          money: 50,
          bread: 50,
          levelFazenda: 1,
          levelInposto: 1,
          levelArmazemComida: 1,
          levelArmazemMoeda: 1,
          levelEspiao: 0,
          tipoProducao: "",
          bonusProducao: "",
          decrescimoProducao: ""}}}//define territorios dos jogadores
    //fim distribuiçao dos territorios e tags players
    for (var i = 0; i < numTerritorios; i ++){
      console.log("enviando dados territorios..." + i);
      socket.emit("START_GAME_SUCESS", Territorios[i]);
      socket.broadcast.emit("START_GAME_SUCESS", Territorios[i]);}//enivio dos dados iniciais aos clientes
      stateGame = "math"
//emite sucesso e envia dados em start game para tds jogadores
  }else{
    for (key in PlayersOnlline){
      socket.emit("START_GAME_FAILED", PlayersOnlline[key]);
      socket.broadcast.emit("START_GAME_FAILED", PlayersOnlline[key]);
    }}//emitir falha em start game para tds os jogadores
});//end start_game_sucess

socket.on("DADOS_CLIENTE", function(pack){
  if (Territorios[pack.index].tagUser == pack.tagUser){
    Territorios[pack.index] = {
      numTerritorios: Territorios[pack.index].numTerritorios,
      tipo: "player",
      index: pack.index,
      tag: pack.tag,
      tagUser: pack.tagUser,
      nameUser: pack.nameUser,
      IDuser: pack.IDuser,
      nameTerritorio: pack.nameTerritorio,
      state: "math",

      a1: pack.a1,
      a2: pack.a2,
      d1: pack.d1,
      d2: pack.d2,
      attack: pack.attack,
      defence: pack.defence,
      money: pack.money,
      bread: pack.bread,
      levelFazenda: pack.levelFazenda,
      levelInposto: pack.levelImposto,
      levelArmazemComida: pack.levelArmazemComida,
      levelArmazemMoeda: pack.levelArmazemMoeda,
      levelEspiao: pack.levelEspiao,
      tipoProducao: pack.tipoProducao,
      bonusProducao: pack.bonusProducao,
      decrescimoProducao: pack.decrescimoProducao
    };
  }

});//end dados clientes. A cada 1 seg os clientes atualizam os dados dos territorios

socket.on("CLIENTE_SOLICITA_DADOS", function(pack){
    console.log(" on CLIENTE_SOLICITA_DADOS");
    if (Territorios[pack.index].index == pack.index){
      console.log("enviando dados sobre o territorio " + Territorios[pack.index].index);
      socket.emit("CLIENTE_RECEBE_DADOS", Territorios[pack.index]);
    }
}); //end cliente_solicita_dados. Envia tds os dados de um index para o respectivo cliente

socket.on("ENVIAR_DADOS_BATALHA", function(pack){
    console.log("on Enviar dadosBatalha.  dados batalha recebido");
    if (Territorios[pack.indexDefesa].tipo == "player"){
      console.log("batalha em player");
      var enviarDados = {
        idPara: Territorios[pack.indexDefesa].IDuser,
        indexDefesa: pack.indexDefesa,
        indexAtaque: pack.indexAtaque,
        isCaptura: pack.isCaptura,
        isVitoria: pack.isVitoria,
        nameUserAtacante : Territorios[pack.indexAtaque].nameUser,
        nameAtacante : Territorios[pack.indexAtaque].nameTerritorio,
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
      console.log("enviando dados batalha para player");
      socket.broadcast.emit("DADOS_ENVIADOS_BATALHA",enviarDados);
    }
    if (pack.isCaptura = "1" && pack.isVitoria == "1"){
      console.log("foi captura e vitoria");
      var newTag;
      if (Territorios[pack.indexDefesa].tipo == "bot"){
        if (Territorios[pack.indexDefesa].tag == "semDono"){
          newTag = Territorios[pack.indexAtaque].tagUser;
        }else if (Territorios[pack.indexDefesa].tag == "fazenda"){
          if (Territorios[pack.indexAtaque].tagUser == "player1"){
            newTag = "fazendaPlayer1"
          }else if (Territorios[pack.indexAtaque].tagUser == "player2"){
            newTag = "fazendaPlayer2"
          }
        }
      }else if (Territorios[pack.indexDefesa].tipo == "player"){
        if (Territorios[pack.indexDefesa].tag == "player1" || Territorios[pack.indexDefesa].tag == "player2"){
          newTag = Territorios[pack.indexAtaque].tagUser;
        }else if (Territorios[pack.indexDefesa].tag == "fazendaPlayer1" || Territorios[pack.indexDefesa].tag == "fazendaPlayer2"){
          if (Territorios[pack.indexAtaque].tagUser == "player1"){
            newTag = "fazendaPlayer1"
          }else if (Territorios[pack.indexAtaque].tagUser == "player2"){
            newTag = "fazendaPlayer2"
          }
        }
      }
      console.log("new tag eh :" + newTag);
      Territorios[pack.indexDefesa] = {
        numTerritorios: Territorios[pack.indexDefesa].numTerritorios,
        tipo: "player",
        index: Territorios[pack.indexDefesa].index,
        tag: newTag,
        tagUser: Territorios[pack.indexAtaque].tagUser,
        nameUser: Territorios[pack.indexAtaque].nameUser,
        IDuser: Territorios[pack.indexAtaque].IDuser,
        nameTerritorio: pack.newNameTerritorio,
        state: "math",
        a1: pack.a1,
        a2: pack.a2,
        d1: pack.d1,
        d2: pack.d2,
        attack: "",
        defence: "",
        money: pack.money,
        bread: pack.bread,
        levelFazenda: Territorios[pack.indexDefesa].levelFazenda,
        levelInposto: Territorios[pack.indexDefesa].levelInposto,
        levelArmazemComida: Territorios[pack.indexDefesa].levelArmazemComida,
        levelArmazemMoeda: Territorios[pack.indexDefesa].levelArmazemMoeda,
        levelEspiao: Territorios[pack.indexDefesa].levelEspiao,
        tipoProducao: Territorios[pack.indexDefesa].tipoProducao,
        bonusProducao: Territorios[pack.indexDefesa].bonusProducao,
        decrescimoProducao: Territorios[pack.indexDefesa].decrescimoProducao
    }
      console.log("enviando dados change territorio");
      socket.broadcast.emit("CHANGE_TERRITORIO", Territorios[pack.indexDefesa]);
    }
    //console.log("ENVIANDO DADOS BATALHA PARA tds  por " + enviarDados.idDe);

});//end socket.on(ENVIAR_DADOS_BATALHA). caço mude territorio envia a todos as mudanças + player sobre derrota

socket.on("ACTION_MAP", function(pack){
    console.log("Action map number: " + pack.ramdomNumber);
    if (pack.isOn == "true"){
      Ataques[pack.ramdomNumber] = {
        nameUserAtaque: Territorios[pack.indexAtaque].nameUser,
        nameTerritorioAtaque: Territorios[pack.indexAtaque].nameTerritorio,
        IDdefesa: Territorios[pack.indexDefesa].IDuser,
        indexAtaque: pack.indexAtaque,
        indexDefesa: pack.indexDefesa,
        isCaptura: pack.isCaptura,
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
        ramdomNumber: pack.ramdomNumber,
        isOn: pack.isOn
      }
      console.log(pack.ramdomNumber + "enviado como on");
      socket.broadcast.emit("ACTION_MAP_RESULT", Ataques[pack.ramdomNumber]);
    }else{
      delete Ataques[pack.ramdomNumber];
      console.log(pack.ramdomNumber + "enviado como fim");
      var dadosFimAtaque = {
        nameUserAtaque: Territorios[pack.indexAtaque].nameUser,
        nameTerritorioAtaque: Territorios[pack.indexAtaque].nameTerritorio,
        IDdefesa: Territorios[pack.indexDefesa].IDuser,
        indexAtaque: pack.indexAtaque,
        indexDefesa: pack.indexDefesa,
        isCaptura: pack.isCaptura,
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
        ramdomNumber: pack.ramdomNumber,
        isOn: pack.isOn
      }
      socket.broadcast.emit("ACTION_MAP_RESULT",dadosFimAtaque);
    }
});//end ACTION_MAP

//-----------------FIM-GAME---------------------------
//-----------------INICIO-DESCONECCAO---------------------------
socket.on("PLAYER_EXIT", function(pack){
    disconectPlayer();
})//END PLAYER_EXIT

socket.on("disconnect", function(){
    disconectPlayer();
})//END disconnect

function disconectPlayer(){
    console.log("tentando desconectar player ID: " + CurrentPlayer.id + " name: " + CurrentPlayer.nameUser + " state: " + CurrentPlayer.state);
    for (key in PlayersOnlline){
      if (PlayersOnlline[key].id == CurrentPlayer.id && PlayersOnlline[key].state == "math"){
        console.log(PlayersOnlline[key].nameUser + " encontrado com estado math");
        PlayersOnlline[key].state = "off"
        if ((quantPlayersOn()) > 0){
          console.log("tag eh: " + PlayersOnlline[key].tag);
          console.log(PlayersOnlline[key].nameUser + " ("+PlayersOnlline[key].id + ") esta desconectado com estado: " + PlayersOnlline[key].state);
          socket.broadcast.emit("DISCONECTED_PLAYER_ON_MATH", PlayersOnlline[key]);
        }else{
          stateGame = "off"
          console.log("a sala passa a estar vazia. Deletando tds os players...");
          for (key2 in PlayersOnlline){
            console.log(PlayersOnlline[key2].nameUser + " foi deletado");
            delete PlayersOnlline[key2]
          }
        }
      }else if (PlayersOnlline[key].id == CurrentPlayer.id && (PlayersOnlline[key].state == "lobby" || PlayersOnlline[key].state == "pre-lobby")){
        socket.broadcast.emit("DISCONECTED_PLAYER_ON_LOBBY", PlayersOnlline[key]);
        console.log(PlayersOnlline[key].nameUser + " ("+PlayersOnlline[key].id + ") foi excluido do lobby com estado: " + PlayersOnlline[key].state);
        delete PlayersOnlline[key];
      }
    }
    console.log("fim da desconeccao");
  }
//-----------------FIM-DESCONECCAO---------------------------
})//end io.conection

http.listen(process.env.PORT || 3000, function(){
  console.log("server listen in 3000");
});
  console.log("-----------------------server is running-----------------------");
