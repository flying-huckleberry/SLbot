$(document).ready(function() {
  //prolly dont need globals, but were good for 1.0
  var json = {}; //global var to store the json we get from ajax
  var statColumns = {}; //will hold what columns need to go in which tables
  var statTypes = [ //used later on as keys to build statColumns
    'All Rotorcraft Hours', //also used to build dropdown selector for each server
    'US Aircraft Hours', //also used in tabulate and getFirstLevelIndices
    'RU Aircraft Hours',
    'Other Aircraft Hours',
    'Player Kills',
    'Player Deaths'
  ];

  //ajax request to get data to populate tables with
  //fire immediately on doc ready
  $.ajax({
    url: "/api/fetch",
    type: "POST",
    dataType: "json",
    data: {},
    //on successful data reception, we can now show the data and make it all functional
    success: function(data) {
      if (data === false) {
        console.log('ERROR: Server could not return a valid database object.');
        return;
      }
      json = data; //make the data global just in case we need it later
      refreshColumnMappings(data); //make all the columns for each type of table
      updateServersTable(data); //populate server list / actions

      //register lodaing icon events and when to start/stop
      $('#loading-icon').bind('showTree', function() {
        $(this).css({'padding-top':'45px','padding-bottom':'35px'});
        $(this).show();
      });
      $('#loading-icon').bind('treeCreated', function() {
        $(this).hide();
        $(this).css({'padding-top':'0px','padding-bottom':'0px'});
      });
      $('.tree-view').on('click', 'button', function() {
        $('#loading-icon').trigger('showTree');
        $('.tree-view button').hide();
        setTimeout(function() { showTree() }, 5);
      });
      //user clicks a show table action, display the table they requested
      $('.table-actions').on('change', 'select', function(e) {
        var dId = $(this).find("option:selected").attr('data-id');
        var val = $(this).find("option:selected").attr('value');
        if (dId !== 'false') {
          $('.table-actions select').each(function() {
            if ($(this).find('option').eq(1).attr('data-id') != dId) {
              $(this).val($(this).find('option:first').val());
            }
          })
          tableToHTML(tabulate(dId, val));
        } else if ( $.fn.DataTable.isDataTable('#datatable') ) {
          $('#datatable').DataTable().destroy();
          $('#datatable').empty();
        }
      });

    }, //end success
    error: function(err) { console.log(err) }
  }); //end ajax call

  //------------------------

  //get the nested ids to look in depending on what the user wants to see
  function getFirstLevelIndices(stat, cols) {
    switch (stat) {
      case statTypes[0]:
        return ['times'];
        break;
      case statTypes[1]:
        return ['times'];
        break;
      case statTypes[2]:
        return ['times'];
        break;
      case statTypes[3]:
        return ['times'];
        break;
      case statTypes[4]:
        return ['kills','friendlyKills','PvP'];
        break;
      case statTypes[5]:
        return ['losses', 'PvP'];
        break;
      default:
        return false;
    }
  }

  //------------------------

  function showTree() {
    $('#json-tree').removeAttr('style');
    $('#json-tree').jsonViewer(json, {collapsed: true}); //call tree view on the json
    $('#loading-icon').trigger('treeCreated');
  }

  //------------------------

  //make the header that lets you choose which table to render
  //choose server, choose stat to view
  function updateServersTable(data) {
    var servers = $('#servers');
    servers.append(
      $('<div></div>').addClass('row').addClass('server-list-row-header')
        .append(
          $('<div></div>').text('Server List').addClass('col-md-8 col-sm-8 col-xs-8')
        ).append(
          $('<div></div>').text('Actions').addClass('col-md-4 col-sm-4 col-xs-4')
        )
    );
    Object.keys(data).forEach(function(k) { //for each server
      servers.append(
        $('<div></div>').addClass('row').addClass('server-list-row').append(
          $('<div></div>').text(data[k]['name']).addClass('col-md-8 col-sm-8 col-xs-8') //add the row for server
        ).append( //add actions
          $('<div></div>').addClass('table-actions').addClass('col-md-4 col-sm-4 col-xs-4').append(
            $('<select></select>').addClass('form-control input-md')
              .append($('<option></option>').attr({'value':'false','data-id':'false'}).text('-'))
              .append($('<option></option>').attr({'value':statTypes[0],'data-id':k}).text(statTypes[0]))
              .append($('<option></option>').attr({'value':statTypes[1],'data-id':k}).text(statTypes[1]))
              .append($('<option></option>').attr({'value':statTypes[2],'data-id':k}).text(statTypes[2]))
              .append($('<option></option>').attr({'value':statTypes[3],'data-id':k}).text(statTypes[3]))
              .append($('<option></option>').attr({'value':statTypes[4],'data-id':k}).text(statTypes[4]))
              .append($('<option></option>').attr({'value':statTypes[5],'data-id':k}).text(statTypes[5]))
          )
        )
      );
    });
    //console.log('updated servers table');
  }

  //------------------------

  //returns specific formatted values according to what data its trying to table
  function floatingPtHours(val) {
    return (Math.round((100*val/3600))/100); //floating pt hours
  }


  //------------------------

  function makeDataRows(table, serverId, stat, columns) {
    //loop through player nodes
      //loop through player's stats likes times
        //determine if node should be used for something
          //if so then use it
          //differnt
          //ways
    var firstLevelIndices = getFirstLevelIndices(stat);
    if (firstLevelIndices == false) { console.log("ERROR getting first level indices");return false;}
    for (var pid in json[serverId]['stats']) { //loop through player nodes
      for (var fli in json[serverId]['stats'][pid]) { //loop through stats for player
        if (firstLevelIndices.indexOf(fli) != -1) { //we want something from here


          //here comes the messy part...

          //Kills table, 'kills' node content derivation
          if (fli == 'kills' && stat == statTypes[4]) {
            for (var index in json[serverId]['stats'][pid][fli]) {
              var nameKey = columns[stat].indexOf(index);
              if (nameKey != -1) {
                if (index == 'Ground Units') {
                  var nonInfantry = 0;
                  for (var type in json[serverId]['stats'][pid][fli][index]) { //add up everything thats not infantry or total to be Ground Units
                    if (type != 'total' && type != 'Infantry') { nonInfantry += parseInt(json[serverId]['stats'][pid][fli][index][type]) }
                  }
                  table[pid][columns[stat].indexOf('Infantry')] = json[serverId]['stats'][pid][fli][index]['Infantry']; //set infantry
                  table[pid][columns[stat].indexOf('Ground Units')] = nonInfantry; //set total
                } else { table[pid][nameKey] = json[serverId]['stats'][pid][fli][index]['total'] }
              }
            }
          //Hours Table, 'times' node content derivation
          } else if (fli == 'times' && (stat == statTypes[0] || stat == statTypes[1] || stat == statTypes[2] || stat == statTypes[3])) {
            var totalHrs = 0;
            for (var index in json[serverId]['stats'][pid][fli]) {
              var nameKey = columns[stat].indexOf(index);
              if (nameKey != -1) {
                totalHrs += json[serverId]['stats'][pid][fli][index]['total'];
                table[pid][nameKey] = floatingPtHours(json[serverId]['stats'][pid][fli][index]['total']);
              }
            }
            //populate total airframe hours (in this category)
            table[pid][columns[stat].indexOf('Total')] = floatingPtHours(totalHrs)
          } else if (fli == 'friendlyKills' && stat == statTypes[4]) { //Friendly Kills count nodes;
            if (json[serverId]['stats'][pid][fli]) { table[pid][columns[stat].indexOf('Friendly Kills')] = Object.keys(json[serverId]['stats'][pid][fli]).length }
            else { table[pid][columns[stat].indexOf('Friendly Kills')] = 0 }
          } else if (fli == 'losses' && stat == statTypes[5]) { //pilotDeath > Deaths, crash > Crashes, eject > Ejections
            table[pid][columns[stat].indexOf('Deaths')] = json[serverId]['stats'][pid][fli]['pilotDeath'];
            table[pid][columns[stat].indexOf('Crashes')] = json[serverId]['stats'][pid][fli]['crash'];
            table[pid][columns[stat].indexOf('Ejections')] = json[serverId]['stats'][pid][fli]['eject'];
          } else if (fli == 'PvP' && stat == statTypes[4]) { //kills > PvP Kills
            table[pid][columns[stat].indexOf('PvP Kills')] = json[serverId]['stats'][pid][fli]['kills'];
          } else if (fli == 'PvP' && stat == statTypes[5]) { //losses > PvP Deaths
            table[pid][columns[stat].indexOf('PvP Deaths')] = json[serverId]['stats'][pid][fli]['losses'];
          }


        }
      }

    }
    //console.log(table);
    return table;
  }

  //------------------------

  function tabulate(serverId, stat) {
    var table = [];
    table[0] = statColumns[stat];
    for (var player in json[serverId]['stats']) {
      table.push([]);
      for (var column in statColumns[stat]) { //go ahead and set name column now
        if (column == 0) { table[parseInt(player)][column] = json[serverId]['stats'][player]['name'] }
        else { table[parseInt(player)][column] = 0 } //if not name, set 0
      }
    }
    return makeDataRows(table, serverId, stat, statColumns);
  }

  //------------------------

  function createTableHeader(arr) {
    var thead = $('<thead></thead>');
    var tr = $('<tr></tr>');
    for (var i in arr) { tr.append($('<th></th>').text(arr[i])) }
    $('.datatable').append(thead.append(tr));
  }

  //------------------------

  function createTableBody(arr) {
    var tbody = $('<tbody></tbody>');
    for (var pid in arr) {
      if (pid !== '0') { //dont add thead data
        var htmlRow = $('<tr></tr>');
        for (var col in arr[pid]) { htmlRow.append($('<td></td>').text(arr[pid][col])) }
        tbody.append(htmlRow);
      }
    }
    $('.datatable').append(tbody);
  }

  //-------------------------

  function tableToHTML(arr) {
    if ( $.fn.DataTable.isDataTable('#datatable') ) {
      $('#datatable').DataTable().destroy();
      $('#datatable').empty();
    }
    $('#dt-container').html('');
    $('#dt-container').append($('<table></table').attr({'class':'table datatable','id':'datatable'}));
    createTableHeader(arr[0]);
    createTableBody(arr);
    $('#datatable').DataTable();
  }

  //-------------------------

  function refreshColumnMappings(json) {
    //these are some of the table-specific columns we will need to look for in the json
    var arch = [ //all rotorcraft hours
      'UH-1H',
      'ah-64d',
      'CobraH',
      'Ka-50',
      'Mi-8MT',
      'SA342L',
      'SA342M'
    ];
    var usach = [ //us aircraft hours
      'A-10C',
      'AV8BNA',
      'F-15C',
      'F-5E-3',
      'F-86F Sabre',
      'FA-18C_hornet',
      'P-51D'
    ];
    var ruach = [ //ru aircraft hours
      'IL-76MD',
      'MiG-15bis',
      'MiG-21Bis',
      'MiG-29A',
      'MiG-29S',
      'Su-25',
      'Su-25T',
      'Su-27',
      'Yak-52'
    ];
    var oach = [ //other aircraft hours
      'AJS37',
      'Bf-109K-4',
      'C-101CC',
      'C-101EB',
      'FW-190D9',
      'L-39C',
      'L-39ZA',
      'M-2000C',
      'SpitfireLFMkIX'
    ];
    var killObjects = [
      'Ground Units',     // the web client will generate 2 columns,
      'Planes',           // Infantry and Ground Units (non-infantry)
      'Helicopters',
      'Ships',
      'Buildings'
    ];


    //make  heli hours columns
    var allRotorcraftHoursCols = [];
    Array.prototype.push.apply(allRotorcraftHoursCols, arch);
    allRotorcraftHoursCols.unshift('Total');
    allRotorcraftHoursCols.unshift('Pilot');

    //make  us ac hours columns
    var usAircraftHoursCols = [];
    Array.prototype.push.apply(usAircraftHoursCols, usach);
    usAircraftHoursCols.unshift('Total');
    usAircraftHoursCols.unshift('Pilot');

    //make  ru ac hours columns
    var ruAircraftHoursCols = [];
    Array.prototype.push.apply(ruAircraftHoursCols, ruach);
    ruAircraftHoursCols.unshift('Total');
    ruAircraftHoursCols.unshift('Pilot');

    //make  other ac hours columns
    var oAircraftHoursCols = [];
    Array.prototype.push.apply(oAircraftHoursCols, oach);
    oAircraftHoursCols.unshift('Total');
    oAircraftHoursCols.unshift('Pilot');

    //make kills columns
    var killsCols = [];
    Array.prototype.push.apply(killsCols, killObjects);
    killsCols.push('PvP Kills');
    killsCols.push('Friendly Kills');
    if (killsCols.indexOf('Ground Units') > -1) {
      killsCols.unshift('Infantry'); //if theyre sending us ground units, make a spot for infantry ground units
    }
    killsCols.unshift('Pilot');

    //deaths columns are completely placid, there is no whitelist or variation needed
    //but make them (again?) anyway since we are being all official
    var deathsCols = [ "Pilot", "Deaths", "Crashes", "Ejections", "PvP Deaths" ];

    //set the global stat columns
    statColumns = {};
    statColumns[statTypes[0]] = allRotorcraftHoursCols;
    statColumns[statTypes[1]] = usAircraftHoursCols;
    statColumns[statTypes[2]] = ruAircraftHoursCols;
    statColumns[statTypes[3]] = oAircraftHoursCols;
    statColumns[statTypes[4]] = killsCols;
    statColumns[statTypes[5]] = deathsCols;

  }
});
