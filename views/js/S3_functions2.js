$(document).ready(function() {
  //prolly dont need globals, but were good for 1.0
  var json = {};
  var cols = {};
  var datatable;
  $.ajax({
    url: "/api/web/fetch",
    type: "POST",
    dataType: "json",
    data: {},
    success: function(data) {
      if (data === false) {
        console.log('ERROR: Server could not return a valid database object.');
        return;
      }

      json = data;
      updateServersTable(data);
      $('.table-links').on('click', 'a', function(e) {
          changeDataTable($(this).attr('data-id'), $(this).text());
      });
    },
    error: function(error) {
     console.log("Error:");
     console.log(error);
    }
  });

  //TODO make loading bar

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
    for (var i in data) { //for each server
      if (i !== 'whitelist') {
        servers.append(
          $('<div></div>').addClass('row').addClass('server-list-row').append(
            $('<div></div>').text(data[i]['name']).addClass('col-md-8 col-sm-8 col-xs-8') //add the row for server
          ).append( //add actions
            $('<div></div>').addClass('table-links').addClass('col-md-4 col-sm-4 col-xs-4')
              .append($('<a></a>').attr({'data-id':i}).text('Hours'))
              .append($('<span></span>').text(' | '))
              .append($('<a></a>').attr({'data-id':i}).text('Kills'))
              .append($('<span></span>').text(' | '))
              .append($('<a></a>').attr({'data-id':i}).text('Deaths'))
          )
        );
      }
    }
    //console.log('updated servers table');
  }

  //get the nested ids to look in depending on what the user wants to see
  function getRelevantAttrs(stat) {
    switch (stat) {
      case 'Hours':
        return ['times'];
        break;
      case 'Kills':
        return ['kills','friendlyKills'];
        break;
      case 'Deaths':
        return ['losses'];
        break;
      default:
        return false;
    }
  }

   function inHelis(str) {
	  return (json['whitelist'].indexOf(str) != -1);
  }

  //return the 229th name if found
  function findOfficialName(names) {
    for (var i in names) {
      if (names[i].indexOf('/229)') > 1) {
        return names[i];
      }
    }
    for (var i in names) {
      return names[i];
    }
  }

  //builds a list of columns to use in the table
  //based on relevance and lots of looping (should only run once)
  function buildColumns(attrs, id, stat) {
    var cols = []; //will hold column names
    cols.push('Pilot'); //get pilot without looping
    for (var pid in json[id]['stats']) { //run through every player node
      //console.log(pid);
      for (var attr in json[id]['stats'][pid]) { //for every id like 'times'
        //console.log('-> '+attr);
        for (var i in attrs) { //see if its in attrs
          //console.log('--> '+attrs[i]);
          if (attr == attrs[i]) { //see if we want something from here
            //console.log('we want everything from ' + attr);
            for (var realcol in json[id]['stats'][pid][attr]) { //push all cols
              //console.log('-------> ' + realcol);
              if (isNaN(realcol)) { //dont add it if its column name is going to be a number
                //console.log('not int');
				if (stat == 'Hours') {
					//console.log(realcol);
					if (inHelis(realcol)) { //only include whitelisted vehicles
						var add = true;
						for (var index in cols) { //for each column weve got so far
						  if (cols[index] == realcol) { //check if we already have it
							add = false;
							break;
						  }
						}
						if (add) { //if its not already in the list, add it
						  cols.push(realcol);
						}
					}
				} else {
					var add = true;
					for (var index in cols) { //for each column weve got so far
					  if (cols[index] == realcol) { //check if we already have it
						add = false;
						break;
					  }
					}
					if (add) { //if its not already in the list, add it
					  cols.push(realcol);
					}
				}

              } else {
                //console.log(realcol+' is a number');
              }
            }
          }
        }
      }
    }
    //console.log('cols');
    //console.log(cols);
    return cols;
  }

  function generateTablePlaceholderData(cols) {
    var data = []; //will make arrays within this array to hold table data
    for (var i in cols) {
      data[cols[i]] = [];
    }
    return data;
  }

  //loop through cols,
  function generateTableHeader(table, cols) {
    var colLabels = $('<tr></tr>');
    for (var i in cols) {
      colLabels.append($('<th></th>').text(cols[i]));
    }
    colLabels.wrap('<thead></thead>');
    table.append(colLabels);
  }

  //returns specific formatted values according to what data its trying to table
  function breakout(node, stat) {
    switch (stat) {
      case 'Hours':
        return (Math.round((100*node['total']/3600))/100);
        break;
      case 'Kills':
        return node['total'];
        break;
      default:
        console.log('wrong stat lookup');
        return '';
    }
  }

  //if node is not something stringable, deal with it
  function makeText(node, stat) {
    switch (typeof node) {
      case 'object':
        //return JSON.stringify(node);
        //node = removeNumberedIndices(node);
        return breakout(node, stat);
        break;
      case 'undefined':
        return '0';
        break;
      default:
        return node.toString();
    }
  }

  //format raw data as html for datatables
  function tableFromData(table, data, cols, stat) {
    table.append($('<tbody></tbody>'));
    for (var i = 0; i < data['Pilot'].length; i++) { //loop for each player
      var htmlRow = $('<tr></tr>');
      //console.log('round ' + i);
      for (var col in cols) {
        //console.log('appending stat ' + data[cols[col]][i] + ' into column [' + cols[col] + '] [' + i +']');
        htmlRow.append($('<td></td>').html(
          makeText(data[cols[col]][i], stat)
        ));
      }
      $('.datatable tbody').append(htmlRow);
    }
  }

  //makes json into an array of content for a table
  function generateTableContent(table, id, stat, cols) {
    var attrs = getRelevantAttrs(stat);
    //console.log('generating placeholder data');
    var data = generateTablePlaceholderData(cols);
    var incrementer = 0;
    //console.log('stats[]'+incrementer);
    //console.log(json[id]);
    for (var pid in json[id]['stats']) { //run through every player node
      //console.log('pid='+pid);
      var name = findOfficialName(json[id]['stats'][pid]['names']);
      //console.log('found official name');
      //console.log(name);
      data['Pilot'][incrementer] = name; //add their name to the list always
      for (var attr in json[id]['stats'][pid]) { //for every name like 'times'
        //console.log('-> '+attr);
        //see if its in attrs
        for (var i in attrs) {
          //console.log('--> '+attrs[i]);
          if (attr == attrs[i]) { //see if we want something from here
            //console.log('we want everything from ' + attr);
            for (var realcol in json[id]['stats'][pid][attr]) { //push 'all' cols
              if (isNaN(realcol)) { //as long as its not a number
      				  if (stat == 'Hours') { //and if its for an hours table
                  //console.log(realcol);
        					if (inHelis(realcol)) { //only include whitelisted vehicles
        						//console.log('-------> ' + realcol);
        						data[realcol][incrementer] = json[id]['stats'][pid][attr][realcol]; //make it so
        					}
      				  } else {
      					  data[realcol][incrementer] = json[id]['stats'][pid][attr][realcol]; //not a number, not for hours, cool with me
      				  }
              }
            }
          }
        }
      }
      incrementer++;
    }
    //console.log(data);
    return tableFromData(table, data, cols, stat);
  }

  //user clicked an action link, create appropriate table
  function changeDataTable(serverId, stat) {
    try {
      datatable.destroy();
    } catch(e) {
      //console.log('cant destroy');
    }
    var table = $('.datatable');
    var cols = buildColumns(getRelevantAttrs(stat), serverId, stat);
    table.html('').attr({'class': 'table datatable'});
    generateTableHeader(table, cols)
    generateTableContent(table, serverId, stat, cols)
    //something something datatable
    $('.datatable tr').first().wrap('<thead></thead>');
    datatable = table.DataTable();
  }


});
