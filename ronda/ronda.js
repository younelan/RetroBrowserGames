/******************************/
/*  card classes start here   */
/******************************/

/* simple example:
pile1=new cardPile()
pile1.push([1,2])
pile1.push([2,2])
pile1.push([3,2])
pile1.push([4,2])
*/

/* constructor for cardPile class, accepts optionally pile contents */
function cardPile(startPile) {
	this.pile=typeof startPile !== 'undefined' ? startPile : []
}
/* cardPile functions */
cardPile.prototype = {
	pile:[],
	/* retrieve pile contents */
	getPile:function() {
		return this.pile
	},
	/* shuffle the deck - implements knuth's shuffle */
	shuffle:function() {
		var idxCurrent = this.pile.length
		var idxSwap
		var tempCard
		while( idxCurrent !==0) {
			idxSwap=Math.floor(Math.random() *idxCurrent)
			idxCurrent--	

			tempCard=this.pile[idxCurrent]
			this.pile[idxCurrent]=this.pile[idxSwap]	
			this.pile[idxSwap]=tempCard
		}
	},
	/* add a card to the bottom */
	push:function(card) {
		return this.pile.push(card)
	},
	/* remove a card from the bottom */
	pop:function() {
		return this.pile.pop()
	},
	/* add a card to the top */
	shift:function() {
		return this.pile.shift()
	},
	/* removea card from the top */
	unshift:function(card) {
		return this.pile.unshift(card)
	},
	/* clear a pile's contents */
	reset:function() {
		this.pile=[]
	}
};
/*constructor for card game, optionally accepts a set of game rules */
function cardGame(startDeck) {

	this.piles=typeof startDeck !== 'undefined' ? startDeck : []
	if(typeof startDeck!=='undefined') {
		for(index in startDeck) {
			this.gameRules[index]=startDeck[index]
		}
	}
	/* fill the deck with all cards cards and optionally shuffle them*/
	for (var i = 0; i < gameRules['suitValues'].length; i++) {
	    for (var j = 0; j < gameRules['cardValues'].length; j++) {
	    	this.push('deck',[ gameRules['cardValues'][j] ,  gameRules['suitValues'][i] ])
	    }
	}
	if(this.gameRules['shuffle']) {
		this.piles['deck'].shuffle()		
	}
	this.currentRules = this.gameRules['dealerRules'][this.gameRules['gameType']]

}
/* card game class implementation */
cardGame.prototype = {
	currentRules:{},
	/* default set of rules is a shuffled standard 53 deck card */
	gameRules:{
		shuffle:true,
		cardValues:['A','2','3','4','5','6','7','8','9','T','J','Q','K'],
		cardNames:['Ace','2','3','4','5','6','7','8','9','Ten','Jack','Queen','King'],
		suitValues:['S','C','D','H'],
		suitNames:['Spades','Clubs','Diamonds','Hearts'],
		gameType:'standard game',
		dealerRules: {
			'standard game':{
				numPlayers:4,
				initial:14,
				last:1,
				normal:1,
				plays:0
			}
		}
	},
	currentPlayer:0,
	currentHand:0,
	/* retrieve a pile contents */
	getPile:function(pile) {
		return typeof this.piles[pile] !== 'undefined' ? this.piles[pile].getPile() : []
	},
	/* add a card to the bottom of a particular deck */
	push:function(pile,card) {

		if (!(pile in this.piles ) ) {			
			this.piles[pile] = new cardPile()
		} 
		return this.piles[pile].push(card)
	},
	/* remove a card from a particular deck from the bottom */
	pop:function(pile) {
		if (pile in this.piles) {			
			return this.piles[pile].pop()
		}
		else {
			return null
		}
	},
	/* add a card to the top of a particular deck */
	unshift:function(pile,card) {

		if (!(pile in this.piles ) ) {			
			this.piles[pile] = new cardPile()
		} 
		return this.piles[pile].unshift(card)
	},
	/* remove a card from the top of a particular deck */
	shift:function(pile) {
		if (pile in this.piles) {			
			return this.piles[pile].shift()
		}
		else {
			return null
		}
	},
	/* deal cards using the current set of rules */
	deal:function() {

		if(this.currentHand==0) {
			dealCount=this.currentRules['initial']	
			/* deal to the table */		
			for(j=0;j<this.currentRules['table'];j++) {
				card=this.pop('deck')
				this.push('table',card)
			}

		}else {
			dealCount=this.currentRules['normal']			

		}
		/* deal to the individual players hands */
		players=this.currentRules['numPlayers']
		for(i=0;i<players;i++) {
			/* clear player hands if the rules specify it */
			if ('player'+i in this.piles && this.gameRules['forceRemove']==true) {			

				this.piles['player'+i].reset()
			}
			for(j=0;j<dealCount;j++) {
				card=this.pop('deck')
				this.push('player'+i,card)
			}
		}
		this.currentHand++

	},
	/* returns the current number of players */
	getNumPlayers:function() {
		return this.currentRules['numPlayers']
	}

}


/*****************************/
/*  ronda game starts here   */
/*****************************/

/* ronda game rules override */
var gameRules={
	cardValues:['1','2','3','4','5','6','7','8','9','r'],
	cardNames:['As','Dos','3','4','5','6','7','Sauta','Cabal','Rey'],
	suitValues:['d','k','g','s'],
	suitNames:['Gold','Black','Cups','Sticks'],
	shuffle:true,
	forceRemove:true,
	gameType:'4 Player game alternate',
	dealerRules: {
		'2 Player game':{
			numPlayers:2,
			initial:3,
			table:4,
			last:4,
			normal:3,
			plays:16
		},
		'3 Player game':{
			numPlayers:3,
			table:4,
			initial:3,
			last:3,
			normal:3,
			plays:13

		},
		'4 Player game alternate':{
			numPlayers:4,
			table:4,
			initial:3,
			last:3,
			normal:3,
			plays:8
		},
		'4 Player game':{
			numPlayers:4,
			table:0,
			initial:4,
			last:4,
			normal:4,
			plays:8
		},
	}
}


/*initiate ronda game */
game=new cardGame(gameRules)

/*get cardHtml - abstract the creation of card */
function getCardHtml(player,idx,suit,prefix="",suffix="gif") {
	onclicktxt = " onclick='onGameClick(\"" + player+"\"" + ",\"" + idx + suit + "\")' "
	idtag = "id='card" + idx + suit + "'"
	if (prefix) {
        imgtag = "<img " + onclicktxt + " src='"+prefix +   idx + suit + "."+suffix+"'>"
		cardclass=""
		tempHand += "<li " + " style='z-index: -70' class='card " + cardclass + "' " +idtag + ">" + imgtag + "</li>\n"
	} else {
		imgtag = idx+suit
		cardclass = "textcard"
		tempHand += "<li " + onclicktxt + " class='card " + cardclass + "' " +idtag + ">" + imgtag + "</li>\n"
	}
	// alert(imgtag)
    return tempHand
}
/*called from the ui when the deal button is pressed */
function deal() {
	/* get new cards */
	game.deal()	
	//prefix="./images/front/"

	var prefix = (typeof prefix === 'undefined') ? '' : prefix;
	/* update the ui for the individual players */
	for(i=0;i<game.getNumPlayers();i++ ) {
		currentPile=game.getPile('player'+i)
		tempHand=""
		for(j=0;j<currentPile.length;j++) {
			getCardHtml(i+1,currentPile[j][1],currentPile[j][0],prefix)
		}
		document.querySelector('#player'+(i+1)).innerHTML=tempHand

	}
	/* update the ui for the table */
	tempHand=''
	currentPile=game.getPile('table')
	for(j=0;j<currentPile.length;j++) {
		getCardHtml(i+1,currentPile[j][1],currentPile[j][0],prefix)
	}
	document.querySelector('#table').innerHTML=tempHand

	document.querySelectorAll('.card').forEach(function(item) {
		item.addEventListener('click', function() {
		  console.log(item.innerHTML);
		});
		 });

	//console.log(tempHand)
}
function onGameClick(player,card) {
	id="card"+card

	message = "Player "+player+" plays "+card
	document.querySelector('#footer').innerHTML=message

	var elem = document.getElementById(id);
	elem.remove()
    //return elem.parentNode.removeChild(elem);
}

