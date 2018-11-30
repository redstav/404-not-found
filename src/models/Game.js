const characters = require('./characters');
const player = require('./Player');
const card = require('./card');


class Game {
    constructor(numPlayers) {
        this.deck=[];
        this.solution = {
            "Suspect": null,
            "Room":null,
            "Weapon": null};
        //this.players;
        this.numPlayers = numPlayers;
        this.currentPlayerTurn;
        this.timeLimit;
        this.playerOrder = [
            player.Player('MISS_SCARLET'),
            player.Player('COL_MUSTARD'),
            player.Player('MRS_WHITE'),
            player.Player('MR_GREEN'),
            player.Player('MRS_PEACOCK'),
            player.Player('PROF_PLUM')];
        this.MAX_TIME = 180000;
        this.turnOver;
        this.turn = 0;
        this.current_turn = 0;
    }

    initDeck() {
        let cardNames = ['MISS_SCARLETT_CARD',
            'COL_MUSTARD_CARD',
            'MRS_WHITE_CARD',
            'MR_GREEN_CARD',
            'MRS_PEACOCK_CARD',
            'PROF_PLUM_CARD',
            'KITCHEN_CARD',
            'BALLROOM_CARD',
            'CONSERVATORY_CARD',
            'DINING_ROOM_CARD',
            'BILLIARD_ROOM_CARD',
            'LIBRARY_CARD',
            'LOUNGE_CARD',
            'HALL_CARD',
            'STUDY_CARD',
            'CANDLESTICK_CARD',
            'DAGGER_CARD',
            'LEAD_PIPE_CARD',
            'REVOLVER_CARD',
            'ROPE_CARD',
            'SPANNER_CARD'];
        for (let i = 0; i<cardNames.length; i++) {
            this.deck[0] = card.Card(cardNames[i]);
        }
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    dealCards() {
        let shuffledArray = this.shuffleArray(this.deck);
        for (let i = 0; i<this.deck.length; i++) {
            if (this.solution == null && this.deck[i].type == "Suspect") {
                this.solution["Suspect"] = this.deck[i];
            }
            else if (this.solution == null && this.deck[i].type == "Room") {
                this.solution["Room"] = this.deck[i];
            }
            else if (this.solution == null && this.deck[i].type == "Weapon"){
                this.solution["Weapon"] = this.deck[i];
            }
        }
        this.deck.splice(this.deck.indexOf(this.solution["Suspect"]),1);
        this.deck.splice(this.deck.indexOf(this.solution["Room"]),1);
        this.deck.splice(this.deck.indexOf(this.solution["Weapon"]),1);

        let allHands = [];
        for (let i = this.numPlayers; i>0; i--){
            allHands.push([]);
        }
        for (let i = 0; i<shuffledArray.length; i++){
            allHands[i%this.numPlayers].push(shuffledArray[i]);
        }
        // assign to each player here
        for (let i = 0; i<this.numPlayers; i++) {
            let p = this.playerOrder[i];
            p.cards = allHands[i]
        }
    }

    isMoveValid(player, destInt) {
        /*
        1- 2,6,21       Study
        2- 1,3
        3- 2,4,7        Hall
        4- 3,5
        5- 4,8,17       Lounge
        6- 1,9
        7- 3,11
        8- 5,13
        9- 6,10,14      Library
        10- 9,11
        11- 7,10,12,15  Billiard Room
        12- 11,13
        13- 8,12,16     Dining Room
        14- 9,17
        15- 11,19
        16- 13,21
        17- 5,14,18     Conservatory
        18- 17,19
        19- 15,18,20    Ball Room
        20- 19,21
        21- 1,16,20     Kitchen
        22- 4           Spawn Scarlet
        23- 6           Spawn Plum
        24- 8           Spawn Mustard
        25- 14          Spawn Peacock
        26- 18          Spawn Green
        27- 20          Spawn White
         */
        let dict = {
            1:  [2,6,21],
            2:  [1,3],
            3:  [2,4,7],
            4:  [3,5],
            5:  [4,8,17],
            6:  [1,9],
            7:  [3,11],
            8:  [5,13],
            9:  [6,10,14],
            10: [9,11],
            11: [7,10,12,15],
            12: [11,13],
            13: [8,12,16],
            14: [9,17],
            15: [11,19],
            16: [13,21],
            17: [5,14,18],
            18: [17,19],
            19: [15,18,20],
            20: [19,21],
            21: [1,16,20],
            22: [4],
            23: [6],
            24: [8],
            25: [14],
            26: [18],
            27: [20]
        };

        let sourceInt = player.position;
        if (dict[sourceInt].includes(destInt)){
            return true;
        }
        else {
            return false;
        }

    }

    movePlayer(player, destInt, isMoved) {
        // isMoved is a boolean that tells if:
        // True: being moved as part of a suggestion
        // False: player trying to move, so move must be valid
        if (isMoved) {
            player.position = destInt;
            return true;
        }
        else {
            if (this.isMoveValid(player, destInt)) {
                player.position = destInt;
                return true;
            }
            else {
                // make another move
                return false;
            }
        }
    }

    handleSuggestion(suggesterPlayer, suspect, weaponID) {
        /*
        Weapon IDs:
        1: Candlestick
        2: LeadPipe
        3: Revolver
        4: Rope
        5: Wrench
        6: Knife
         */
        this.movePlayer(suspect, suggesterPlayer.position(), true);
        let playInt = this.playerOrder.indexOf(suggesterPlayer.characterName)+1;
        let checkingPlayer = this.playerOrder[playInt%this.numPlayers];
        let shownCard = null;
        while (checkingPlayer != suggesterPlayer) {
            shownCard = checkingPlayer.checkSuggestion(suspect, suggesterPlayer.position(), weaponID);
            if (shownCard != null) {
                return shownCard;
            }
        }
        // No one had any of the suggested deck
        return null;
    }

    handleAccusation(accuserPlayer, suspect, roomInt, weaponID) {
        if (this.solution["Character"] == suspect){
            if (this.solution["Room"] == roomInt) {
                if (this.solution["Weapon"] == weaponID) {
                    //Game Over
                    GameOver();
                }
            }
        }
        accuserPlayer.hasAccused = true;
    }

  startTimer(){
    this.turnTime = setTimeout(() => {
        nextTurn();
    },MAX_TIME)
  }
  resetTimer(){
        if(typeof turnTime == MAX_TIME){
            clearTimeout(turnOver);
        }
  }
  nextTurn(){
        this.turn = current_turn++ % numPlayers -1;
        this.startTimer();
  }

}

module.exports = Game;