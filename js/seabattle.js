'use strict';

function SeaBattle(targetContainer, edge) {
    //Список css-классов
    var cssClasses = {
        containerClassName: 'container',
        blockClassName: 'block',
        areaClassName: 'area',
        seaContainerClassName: 'seaContainer',
        seaClassName: 'sea',
        messagesClassName: 'messages',
        messageClassName: 'message',
        cellClassName: 'cell',
        cellDeadClassName: 'dead',
        cellBoatClassName: 'boat',
        cellWaterClassName: 'water',
        cellMissClassName: 'miss'
    };
    //Список идентификаторов элементов
    var elementsIds = {
        gameContainerId: 'game_container',
        playerNameId: 'player_name',
        computerNameId: 'computer_name',
        playerFieldId: 'player_field',
        playerTableId: 'player_sea',
        computerFieldId: 'computer_field',
        computerTableId: 'computer_sea',
        messagesFieldId: 'messages',
        cellIdPrefix: 'cell_',
        rowIdPrefix: 'row_'
    };

    //Ребро поля
    var _edge = edge;

    //Поле с сообщениями
    var _messagesArea;

    //Поле, содержащее игру
    var _gameContainer;

    //Карты полей боя игроков
    var _computerMap, _playerMap;

    //Список кораблей и их координат у игроков
    var _playerShips, _computerShips;

    //Список сторон, на которых можно расположить корабль
    var _possibleDirections = ['top', 'bottom', 'right', 'left'];

    //Получаем html-текст поля ввода с именем игрока
    var _getPlayerNameInputHtml = function (id, defaultName, title, placeholder, autofocus) {
        return $('<input>')
            .attr('id', id)
            .attr('type', 'text')
            .attr('placeholder', placeholder)
            .attr('title', title)
            .attr('autofocus', autofocus ? 'true' : 'false')
            .attr('value', defaultName)
            .prop('outerHTML');
    };

    //Получаем игровое поле для указанного игрока
    var _getSeaArea = function (id, labelValue, inputId, inputDefaultValue, inputTitle, inputPlaceholder, inputAutoFocus) {
        return $('<div>')
            .attr('class', cssClasses.blockClassName)
            .append(
                $('<label>')
                    .attr('for', id)
                    .html(
                        labelValue + ' ' + _getPlayerNameInputHtml(
                            inputId,
                            inputDefaultValue,
                            inputTitle,
                            inputPlaceholder,
                            inputAutoFocus
                        )
                    )
            )
            .append(
                $('<div>')
                    .attr('id', id)
                    .attr('class', cssClasses.areaClassName + ' ' + cssClasses.seaContainerClassName)
            );
    };

    //Получаем поле с сообщениями
    var _getMessagesArea = function () {
        return $('<div>')
            .attr('class', cssClasses.blockClassName)
            .append(
                $('<label>')
                    .attr('for', elementsIds.messagesFieldId)
                    .html('Сообщения:')
            )
            .append(
                $('<div>')
                    .attr('id', elementsIds.messagesFieldId)
                    .attr('class', cssClasses.areaClassName + ' ' + cssClasses.messagesClassName)
            );
    };

    //Получить текущие дату и время в читаемой строке
    var _getCurrentDateTimeString = function () {
        var delimiter = '.';
        var currentDateTime = new Date();
        return currentDateTime.getDate() + delimiter
            + (currentDateTime.getMonth() + 1) + delimiter
            + currentDateTime.getFullYear() + ' '
            + currentDateTime.getHours() + delimiter
            + currentDateTime.getMinutes();
    };

    //Добавить новое сообщение
    var _createMessage = function (text, colorClass) {
        if (!_messagesArea) {
            _messagesArea = $('#' + elementsIds.messagesFieldId);
        }
        _messagesArea.prepend(
            $('<p>')
                .attr('class', cssClasses.messageClassName)
                .html(_getCurrentDateTimeString() + ' : ' + text)
        );

    };

    //Получить поле, содежащее игру
    var _getGameContainer = function () {
        var gameContainer = $('<div>')
            .attr('id', elementsIds.gameContainerId)
            .attr('class', cssClasses.containerClassName)
            .append($('<h1>').html('Морской бой'));

        gameContainer
            .append(
                _getSeaArea(
                    elementsIds.playerFieldId,
                    'Ваше поле,',
                    elementsIds.playerNameId,
                    'Игрок',
                    'Имя игрока',
                    'Введите ваше имя',
                    true
                )
            ).append(
            _getSeaArea(
                elementsIds.computerFieldId,
                'Противник',
                elementsIds.computerNameId,
                'Компьютер',
                'Имя компьютера',
                'Введите имя компьютера',
                false
            )
        ).append(
            _getMessagesArea()
        );

        return gameContainer;
    };


    //Отрисовать контейнер игры внутри указанного элемента
    var _drawGameContainer = function (target) {
        _gameContainer = _getGameContainer();
        target.empty();
        target.append(_gameContainer)
    };

    //Получить имя игрока
    var _getPlayerName = function () {
        return $('#' + elementsIds.playerNameId).val();
    };

    //Получить имя компьютера
    var _getComputerName = function () {
        return $('#' + elementsIds.computerNameId).val();
    };

    //Получить случайно целое число  в интервале
    var _getRandomInt = function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    //Построить пустую карту с указанной шириной грани
    var _createEmptyShipsMap = function () {
        var emptyMap = [];
        for (var x = 1; x <= _edge; x++) {
            emptyMap[x] = [];
            for (var y = 1; y <= _edge; y++) {
                emptyMap[x][y] = -1;
            }
        }
        return emptyMap;
    };

    //Проверить, свободны ли ячейка и её окрестности от кораблей
    var _cellRangeIsFree = function (map, cell_x, cell_y) {
        if (map[cell_x] && map[cell_x][cell_y]) {
            var coordinate_x, coordinate_y;
            for (var x = -1; x <= 1; x++) {
                for (var y = -1; y <= 1; y++) {
                    coordinate_x = cell_x + x;
                    coordinate_y = cell_y + y;
                    if (map[coordinate_x]
                        && map[coordinate_x][coordinate_y] == 0) {
                        return false;
                    }
                }
            }
            return true;
        }
        return false;
    };

    //Проверить возможность размещения судна в определенном направлении
    var _checkDirection = function (map, direction, x, y, shipLength) {
        switch (direction) {
            case 'top':
                if (x + shipLength <= edge) {
                    for (var tx = x; tx && tx < x + shipLength; tx++) {
                        if (!_cellRangeIsFree(map, tx, y)) {
                            return false;
                        }
                    }
                }
                else {
                    return false;
                }
                break;
            case 'bottom':
                if (x - shipLength < 0) {
                    for (var bx = x; bx > x - shipLength; bx--) {
                        if (!_cellRangeIsFree(map, bx, y)) {
                            return false;
                        }
                    }
                }
                else {
                    return false;
                }
                break;
            case 'left':
                if (y - shipLength < 0) {
                    for (var ly = y; ly > y - shipLength; ly--) {
                        if (ly < 0 || !map[x] || !map[x][ly] || !_cellRangeIsFree(map, x, ly)) {
                            return false;
                        }
                    }
                }
                else {
                    return false;
                }

                break;
            case 'right':
                if (y + shipLength < edge) {
                    for (var ry = y; ry < y + shipLength; ry++) {
                        if (ry > edge || !map[x] || !map[x][ry] || !_cellRangeIsFree(map, x, ry)) {
                            return false;
                        }
                    }
                }
                else {
                    return false;
                }
                break;
        }
        return true;
    };

    //Проверить направления для размещения судна в случайном порядке
    var _getRandomValidDirection = function (map, x, y, shipLength) {
        var directionsArray = _possibleDirections;
        var currentDirection;
        for (var i = directionsArray.length - 1; i >= 0; i--) {
            var index = _getRandomInt(0, directionsArray.length - 1);
            currentDirection = directionsArray[index];
            directionsArray.slice(index, 1);
            switch (currentDirection) {
                case 'top':
                    if (_checkDirection(map, currentDirection, x, y, shipLength)) {
                        return currentDirection;
                    }
                    break;
                case 'bottom':
                    if (_checkDirection(map, currentDirection, x, y, shipLength)) {
                        return currentDirection;
                    }
                    break;
                case 'left':
                    if (_checkDirection(map, currentDirection, x, y, shipLength)) {
                        return currentDirection;
                    }
                    break;
                case 'right':
                    if (_checkDirection(map, currentDirection, x, y, shipLength)) {
                        return currentDirection;
                    }
                    break;
            }
        }
        return null;
    };

    //Разместить лодку на карте
    var _placeShipToMap = function (map, direction, x, y, shipLength, owner) {
        var boat = [];
        switch (direction) {
            case 'top':
                for (var tx = x; tx < x + shipLength; tx++) {
                    boat.push([tx, y]);
                    map[tx][y] = 0;
                }
                break;
            case 'bottom':
                for (var bx = x; bx > x - shipLength; bx--) {
                    boat.push([bx, y]);
                    map[bx][y] = 0;
                }
                break;
            case 'left':
                for (var ly = y; ly > y - shipLength; ly--) {
                    boat.push([x, ly]);
                    map[x][ly] = 0;
                }
                break;
            case 'right':
                for (var ry = y; ry < y + shipLength; ry++) {
                    boat.push([x, ry]);
                    map[x][ry] = 0;
                }
                break;
            case 'single': {
                boat.push([x, y]);
                map[x][y] = 0;
                break;
            }
        }
        //Добавляем в список кораблей игрока
        if (owner == 'player') {
            if (!_playerShips) {
                _playerShips = [];
            }
            _playerShips.push(boat);
        }
        else {
            if (!_computerShips) {
                _computerShips = [];
            }
            _computerShips.push(boat);
        }
        return map;
    };

    //Создать карту размещения судов на поле
    var _makeMap = function (map, owner) {
        for (var shipLength = 4; shipLength > 0; shipLength--) {
            for (var shipsCount = 1; shipsCount <= 5 - shipLength; shipsCount++) {
                var notReady = true;
                while (notReady) {
                    var x = _getRandomInt(1, edge);
                    var y = _getRandomInt(1, edge);
                    notReady = false;
                    if (_cellRangeIsFree(map, x, y)) {
                        if (shipLength > 1) {
                            var direction = _getRandomValidDirection(map, x, y, shipLength);
                            if (direction) {
                                map = _placeShipToMap(map, direction, x, y, shipLength, owner);
                            }
                            else {
                                notReady = true;
                            }
                        }
                        else {
                            map = _placeShipToMap(map, 'single', x, y, shipLength, owner);
                        }
                    }
                    else {
                        notReady = true;
                    }
                }

            }
        }
        return map;
    };

    //Обработка выстрела в списке кораблей игрока
    var _hitShip = function (target, x, y) {
        var shipsCount;
        if (target == 'player') {
            shipsCount = _playerShips.length;
            for (var pi = 0; pi < _playerShips.length; pi++) {
                for (var pShipCoordinateIndex = 0;
                     pShipCoordinateIndex < _playerShips[pi].length;
                     pShipCoordinateIndex++) {
                    if (_playerShips[pi][pShipCoordinateIndex][0] == x
                        && _playerShips[pi][pShipCoordinateIndex][1] == y) {
                        _playerShips[pi].splice(pShipCoordinateIndex, 1);
                        if (_playerShips[pi].length == 0) {
                            _playerShips.splice(pi, 1);
                        }
                        return _playerShips.length != shipsCount;
                    }
                }
            }

        }
        else {
            shipsCount = _computerShips.length;
            for (var ci = 0; ci < _computerShips.length; ci++) {
                for (var cShipCoordinateIndex = 0;
                     cShipCoordinateIndex < _computerShips[ci].length;
                     cShipCoordinateIndex++) {
                    if (_computerShips[ci][cShipCoordinateIndex][0] == x
                        && _computerShips[ci][cShipCoordinateIndex][1] == y) {
                        _computerShips[ci].splice(cShipCoordinateIndex, 1);
                        if (_computerShips[ci].length == 0) {
                            _computerShips.splice(ci, 1);
                        }
                        return _computerShips.length != shipsCount;
                    }
                }
            }
        }

    };


    //Обработка выстрела игрока
    var _fire = function (target, x, y) {
        if (target != 'player') {
            //Если уже попадал или мазал то ничего не делаем
            if (_computerMap[x][y] != 2 && _computerMap[x][y] != 1) {
                if (_hitShip(target, x, y)) {
                    var message ='Мы уничтожили корабль противника!';
                    _createMessage(message)
                    alert(message);
                }
                _drawShot(target, x, y);
                //Ответный выстрел компьтера
                setTimeout(function () {
                    var x, y;
                    x = _getRandomInt(1, 10);
                    y = _getRandomInt(1, 10);

                    //TODO:Ищем места куда не стреляли, возможен зактык при малом числе оставшихся ячеек, решить в перспективе
                    while (_playerMap[x][y] == 2 && _computerMap[x][y] != 1) {
                        x = _getRandomInt(1, 10);
                        y = _getRandomInt(1, 10);
                    }
                    if (_hitShip('player', x, y)) {
                        var message = 'Наш корабль уничтожен!';
                        _createMessage(message);
                        alert(message);
                    }
                    _drawShot('player', x, y);
                }, 500)
            }
        }
        else {
            _createMessage('Капитан, это наше поле :с');
        }
    };

    //отрисовать выстрел компьтера по координатам
    var _drawComputerShot = function (cell, x, y) {
        if (_playerMap[x][y] == 1 || cell.hasClass(cssClasses.cellMissClassName)) {
            //_createMessage('Повторный выстрел по координатам ' + _getCellName(x, y));
        }
        else {
            if (_playerMap[x][y] == 0) {
                _playerMap[x][y] = 1;
                _createMessage(_getComputerName() + ' попал в ваш корабль! ' + _getCellName(x, y) + ' горит!');
                cell.attr('class', cssClasses.cellDeadClassName);
            }
            else {
                _playerMap[x][y] = 2;
                _createMessage(_getComputerName() + ' промахнулся в ' + _getCellName(x, y) + '! Так держать, капитан!');
                cell.attr('class', cssClasses.cellMissClassName);
            }
        }
    };

    //Отрисовать выстрел игрока по координатам
    var _drawPlayerShot = function (cell, x, y) {
        if (_computerMap[x][y] == 1 || cell.hasClass(cssClasses.cellMissClassName)) {
            _createMessage('Повторный выстрел по координатам ' + _getCellName(x, y));
        }
        else {
            if (_computerMap[x][y] == 0) {
                _computerMap[x][y] = 1;
                _createMessage('Капитан, ' + _getPlayerName() + ', цель ' + _getCellName(x, y) + ' поражена!');
                cell.attr('class', cssClasses.cellDeadClassName);
            }
            else {
                _computerMap[x][y] = 2;
                _createMessage('Капитан, ' + _getPlayerName() + ', промах по ' + _getCellName(x, y) + '.Противник разгадал наши планы.');
                cell.attr('class', cssClasses.cellMissClassName);
            }
        }
    };

    //Отрисовать выстрел в ячейку по координатам
    var _drawShot = function (target, x, y) {
        var cell = $('td[data-owner="' + target + '"][data-x="' + x + '"][data-y="' + y + '"]');
        if (target == 'player') {
            _drawComputerShot(cell, x, y);
        }
        else {
            _drawPlayerShot(cell, x, y);
        }
    };

    //Получить строковое имя ячейки
    var _getCellName = function (x, y) {
        return String.fromCharCode(64 + y) + x;
    };

    //Получить ячейку с указанным классом
    var _getTableCell = function (x, y, status, owner) {
        var cell = $('<td>')
            .attr('id', elementsIds.cellIdPrefix + owner + '_' + x + '_' + y)
            .attr('data-owner', owner)
            .attr('data-x', x)
            .attr('data-y', y)
            .attr('title', _getCellName(x, y));

        cell.click(function () {
            _fire(owner, x, y);
        });

        switch (status) {
            case 'water':
                cell.attr('class', cssClasses.cellClassName + ' ' + cssClasses.cellWaterClassName);
                break;
            case 'miss':
                cell.attr('class', cssClasses.cellClassName + ' ' + cssClasses.cellMissClassName);
                break;
            case 'boat':
                cell.attr('class', cssClasses.cellClassName + ' ' + cssClasses.cellBoatClassName);
                break;
            case 'dead':
                cell.attr('class', cssClasses.cellClassName + ' ' + cssClasses.cellDeadClassName);
                break;
        }
        return cell;
    };

    //Получить сформирвоанную таблицу с морем
    var _getSea = function (seaId, owner, map, showBoats) {
        var seaContainer = $('<table>')
            .attr('id', seaId)
            .attr('class', cssClasses.seaClassName);
        for (var x = 1; x < map.length; x++) {
            var tr = $('<tr>').attr('id', elementsIds.rowIdPrefix + x);
            for (var y = 1; y < map[x].length; y++) {
                if (showBoats) {
                    if (map[x][y] == 0) {
                        tr.append(_getTableCell(x, y, 'boat', owner));
                    }
                    else {
                        tr.append(_getTableCell(x, y, 'water', owner));
                    }
                }
                else {
                    tr.append(_getTableCell(x, y, 'water', owner));
                }
            }
            seaContainer.append(tr);
        }
        return seaContainer;
    };

    //Поместить поле боя в контейнер
    var _drawSea = function (id, map, owner, target, showBoats) {
        var sea = _getSea(id, owner, map, showBoats);
        target.empty();
        target.append(sea);
    };

    _playerMap = _createEmptyShipsMap();
    _computerMap = _createEmptyShipsMap();

    return {

        //Инициализация игры
        init: function () {
            _drawGameContainer(targetContainer);
            _createMessage('Добро пожаловать в морской бой!');
            _playerMap = _makeMap(_playerMap, 'player');
            _computerMap = _makeMap(_computerMap, 'computer');
            _drawSea(elementsIds.playerTableId, _playerMap, 'player', $('#' + elementsIds.playerFieldId), true);
            _drawSea(elementsIds.computerTableId, _computerMap, 'computer', $('#' + elementsIds.computerFieldId));
        }


    }

}
