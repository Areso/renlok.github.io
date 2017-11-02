const UserActions = {
    changeRoute: function(newRouteId) {
        player.settings.currentRouteId = newRouteId;
        enemy.generateNew(ROUTES[player.settings.currentRegionId][newRouteId]);
        player.addPokedex(enemy.activePoke().pokeName(), (enemy.activePoke().shiny() ? POKEDEXFLAGS.seenShiny : POKEDEXFLAGS.seenNormal));
        if (enemy.activePoke().shiny()) {
            player.statistics.shinySeen++;
        } else {
            player.statistics.seen++;
        }
        combatLoop.changeEnemyPoke(enemy.activePoke());
        renderView(dom, enemy, player);
        player.savePokes();
        dom.renderRouteList('areasList', ROUTES[player.settings.currentRegionId]);
        dom.renderPokeDex();
    },
    changePokemon: function(newActiveIndex) {
        player.setActive(newActiveIndex);
        combatLoop.changePlayerPoke(player.activePoke());
        renderView(dom, enemy, player)
    },
    deletePokemon: function(event, index) {
        if (event.shiftKey) {
            const pokemon = player.getPokemon()[index];
            player.deletePoke(index);
            if (!player.hasPokemon(pokemon.pokeName())) {
                player.addPokedex(pokemon.pokeName(), (pokemon.shiny() ? POKEDEXFLAGS.releasedShiny : POKEDEXFLAGS.releasedNormal));
            }
            combatLoop.changePlayerPoke(player.activePoke());
            renderView(dom, enemy, player);
            player.savePokes();
            if (pokemon.shiny()) {
                player.settings.releasedShiny++;
            } else {
                player.settings.releasedNormal++;
            }
        } else {
            alert('Hold shift while clicking the X to release a pokemon')
        }
    },
    healAllPlayerPokemons: function() {
        if (player.healAllPokemons() === "healed") {
            dom.gameConsoleLog('Full heal!', 'white');
            combatLoop.refresh();
            renderView(dom, enemy, player)
        }
    },
    changeRegion: function() {
        const regionSelect = document.getElementById('regionSelect');
        player.settings.currentRegionId = regionSelect.options[regionSelect.selectedIndex].value;
        this.changeRoute(Object.keys(ROUTES[player.settings.currentRegionId])[0]);
    },
    enablePokeListDelete: function() {
        dom.renderPokeList();
    },
    enableViewPokedex: function() {
        if (dom.checkConfirmed('#enablePokedex')) {
            document.querySelector('#playerPokesList').classList.add('hidden');
            document.querySelector('#playerPokeDex').classList.remove('hidden')
        } else {
            document.querySelector('#playerPokesList').classList.remove('hidden');
            document.querySelector('#playerPokeDex').classList.add('hidden');
            dom.renderPokeList();
        }
    },
    changeDexView: function() {
        const regionSelect = document.getElementById('dexView');
        player.settings.dexView = regionSelect.options[regionSelect.selectedIndex].value;
        dom.renderPokeDex();
    },
    changeCatchOption: function(newCatchOption) {
        combatLoop.changeCatch(newCatchOption)
    },
    clearGameData: function() {
        if (dom.checkConfirmed('#confirmClearData')) {
            localStorage.clear();
            window.location.reload(true)
        }
    },
    clearConsole: function() {
        dom.gameConsoleClear();
    },
    changeSelectedBall: function(newBall) {
        player.changeSelectedBall(newBall)
    },
    pokemonToFirst: function(pokemonIndex) {
        const moveToFirst = (index, arr) => {
            arr.splice(0, 0, arr.splice(index, 1)[0])
        };

        moveToFirst(pokemonIndex, player.getPokemon());
        player.savePokes();
        combatLoop.changePlayerPoke(player.activePoke());
        renderView(dom, enemy, player)
    },
    pokemonToDown: function(pokemonIndex) {
        const moveToDown = index => arr => [
            ...arr.slice(0,parseInt(index)),
            arr[parseInt(index)+1],
            arr[parseInt(index)],
            ...arr.slice(parseInt(index)+2)
        ];
        const newPokemonList = moveToDown(pokemonIndex)(player.getPokemon());
        player.reorderPokes(newPokemonList);
        player.savePokes();
        combatLoop.changePlayerPoke(player.activePoke());
        renderView(dom, enemy, player)
    },
    pokemonToUp: function(pokemonIndex) {
        const moveToUp = index => arr => [
            ...arr.slice(0,parseInt(index)-1),
            arr[parseInt(index)],
            arr[parseInt(index)-1],
            ...arr.slice(parseInt(index)+1)
        ];

        const newPokemonList = moveToUp(pokemonIndex)(player.getPokemon());
        player.reorderPokes(newPokemonList);
        player.savePokes();
        combatLoop.changePlayerPoke(player.activePoke());
        renderView(dom, enemy, player)
    },
    evolvePokemon: function(pokemonIndex) {
        player.getPokemon()[pokemonIndex].tryEvolve(player.getPokemon()[pokemonIndex].shiny());
        renderView(dom, enemy, player)
    },
    forceSave: function() {
        player.savePokes();
        $(`#forceSave`).style.display = 'inline';
    },
    exportSaveDialog: function() {
        document.getElementById('saveDialogTitle').innerHTML = 'Export your save';
        if (document.queryCommandSupported('copy')) {
            document.getElementById('copySaveText').style.display = 'initial';
        }
        document.getElementById('saveText').value = player.saveToString();
        document.getElementById('loadButtonContainer').style.display = 'none';
        document.getElementById('saveDialogContainer').style.display = 'block';
        $(`#settingsContainer`).style.display = 'none';
    },
    importSaveDialog: function() {
        document.getElementById('saveDialogTitle').innerHTML = 'Import a save';
        document.getElementById('copySaveText').style.display = 'none';
        document.getElementById('saveText').value = '';
        document.getElementById('loadButtonContainer').style.display = 'block';
        document.getElementById('saveDialogContainer').style.display = 'block';
        $(`#settingsContainer`).style.display = 'none';
    },
    importSave: function() {
        if (window.confirm('Loading a save will overwrite your current progress, are you sure you wish to continue?')) {
            player.loadFromString(document.getElementById('saveText').value.trim());
            document.getElementById('saveDialogContainer').style.display = 'none';
            renderView(dom, enemy, player)
        }
    },
    copySaveText: function() {
        document.getElementById('saveText').select();
        document.execCommand('copy');
        window.getSelection().removeAllRanges()
    },
    changePokeSortOrder: function() {
        player.sortPokemon();
        player.savePokes();
        combatLoop.changePlayerPoke(player.activePoke());
        renderView(dom, enemy, player);
    },
    changeSpriteChoice: function() {
        if (document.getElementById('spriteChoiceFront').checked) {
            player.settings.spriteChoice = 'front';
            document.getElementById('player').className = 'container poke frontSprite'
        } else {
            player.settings.spriteChoice = 'back';
            document.getElementById('player').className = 'container poke'
        }
        player.savePokes();
        renderView(dom, enemy, player)
    },
    viewStatistics: function() {
        let statisticStrings = {
            'seen':'Pokemon Seen',
            'caught':'Pokemon Caught',
            'released':'Pokemon Released',
            'beaten':'Pokemon Beaten',
            'shinySeen':'Shiny Pokemon Seen',
            'shinyCaught':'Shiny Pokemon Caught',
            'shinyReleased':'Shiny Pokemon Released',
            'shinyBeaten':'Shiny Pokemon Beaten',
            'totalDamage':'Total Damage Dealt',
            'totalThrows':'Total Catch Attempts',
            'successfulThrows':'Successful Catches',
            'pokeballThrows':'Pokeball Throws',
            'pokeballSuccessfulThrows':'Catches with Pokeball',
            'greatballThrows':'Greatball Throws',
            'greatballSuccessfulThrows':'Catches with Greatball',
            'ultraballThrows':'Ultraball Throws',
            'ultraballSuccessfulThrows':'Catches with Ultraball',
        };
        let statList = '';
        for (let statValue in player.statistics) {
            statList += '<li>' + statisticStrings[statValue] + ': ' + player.statistics[statValue] + '</li>';
        }
        document.getElementById('statisticsList').innerHTML = statList;
        document.getElementById('statisticsContainer').style.display = 'block'
    },
    viewSettings: function() {
        document.getElementById('settingsContainer').style.display = 'block';
        $(`#forceSave`).style.display = 'none';
    },
    viewAchievements: function() {
        document.getElementById('achievementsContainer').style.display = 'block';
    },
    viewTown: function() {
        document.getElementById('townContainer').style.display = 'block';
    }
};