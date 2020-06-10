const IO = {
  init: () => {
    IO.socket = io();
    App.Player.sockID = IO.sockID;
    IO.bindEvents();
  },

  bindEvents: () => {
    IO.socket.on("connected", IO.onConnected);
    IO.socket.on("newGameCreated", IO.onNewGameCreated);
    IO.socket.on("gameJoined", IO.onGameJoined);
    IO.socket.on("updateLobby", IO.onUpdateLobby);
    IO.socket.on("debug", IO.debug);
    IO.socket.on("showError", IO.onError);
  },

  onConnected: (data) => {
    console.log(data.message);
  },

  debug: (data) => {
    if (typeof data === "string") console.log(data);
    else {
      console.log(`${JSON.stringify(data, undefined, 2)}`);
    }
  },

  onError: (data) => {
    App.showError(data.error);
  },

  onNewGameCreated: (gameID) => {
    App.Player.isOwner = true;
    App.Game.init(gameID, true);
    App.showLobbyScreen(gameID);
  },

  /**
   * @param data {gameID: *, playerNames: *, error: *}
   */
  onGameJoined: (data) => {
      App.showLobbyScreen(data.gameID, data.playerNames);
      App.Game.init(data.gameID, false);
  },
  /**
   * @param {names: *, reset: bool} data
   */
  onUpdateLobby: (data) => {
    if (data.reset) App.resetPlayerNames();
    data.names.forEach((name) => App.addPlayerName(name));
  },
};

const App = {
  // runs once when everything loads for the first time
  init: () => {
    App.cacheElements();
    App.showInitScreen();
    App.bindEvents();

    // initialize the fastclick library
    FastClick.attach(document.body);
  },
  // creates references to important on-screen elements
  cacheElements: () => {
    App.$doc = $(document);

    // Templates
    App.$gameArea = $("#gameArea");
    App.$templateIntroScreen = $("#intro-screen-template").html();
    // App.$templateNewGame = $('#create-game-template').html();
    // App.$templateJoinGame = $('#join-game-template').html();
    App.$templateLobby = $("#lobby-template").html();
  },

  showError: (error) => {
    if ($("#errorMessage").length) {
      $("#errorMessage").stop().show().animate({opacity:'100'}).text(error);
      setTimeout(() => $("#errorMessage").fadeOut(3000), 500);
    }
    else {
      alert(error);
    }
  },

  showInitScreen: () => {
    App.$gameArea.html(App.$templateIntroScreen);
    // check first so as to not get rid of the placeholder if the name is empty
    if (App.Player.name) $("#playerName").val(App.Player.name);
  },

  showLobbyScreen: (gameID, playerNames) => {
    App.$gameArea.html(App.$templateLobby);
    if (playerNames !== undefined) {
      playerNames.forEach((name) => App.addPlayerName(name));
    }
    // have to add the player's own name as well!
    App.addPlayerName(App.Player.name);

    $("#gameURL").text(window.location.href);
    $("#gameID").text(gameID);
    console.log("gameID:", gameID);
    console.log("game URL:", window.location.href);
  },

  resetPlayerNames: () => {
    $("#players").empty();
  },

  addPlayerName: (name) => {
    $("#players").append(`<li>${name}</li>`);
  },

  bindEvents: () => {
    App.$doc.on("click", "#btnCreateGame", App.onCreateClick);
    App.$doc.on("click", "#btnLeaveGame", App.onLeaveClick);
    App.$doc.on("click", "#btnJoinGame", App.onJoinClick);
    App.$doc.on("change", "#playerName", App.Player.saveName);
  },

  onCreateClick: () => {
    IO.socket.emit("createGame", { name: App.Player.name });
  },

  onJoinClick: () => {
    IO.socket.emit("joinGame", {
      name: App.Player.name,
      gameID: $("#gameID").val(),
    });
  },

  onLeaveClick: () => {
    IO.socket.emit("leaveGame", { gameID: App.Game.gameID });
    App.Game.reset();
    App.showInitScreen();
  },

  Player: {
    // player that starts the game
    // TODO: random player that is still in the game after previous owner leaves
    isOwner: false,
    // socket.io socket object id. Unique for each player.
    // Generated by the browser when the player initially connects to the server
    sockID: "",
    // screen name of the player
    name: "",

    saveName: () => {
      App.Player.name = $("#playerName").val();
    },
  },
  Game: {
    // identical to ID of the socket.io room of the game
    gameID: null,

    init: (gameID, isOwner) => {
      App.Game.gameID = gameID;
      App.Player.isOwner = isOwner;
    },

    reset: () => {
      App.Game.gameID = null;
      App.Player.isOwner = false;
    },
  },
};

IO.init();
App.init();
