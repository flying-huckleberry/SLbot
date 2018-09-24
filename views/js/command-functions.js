$(document).ready(function() {
  var types = {'hours':{},'kills':{}};
  var servers = {};
  //get types object
  $.ajax({
    url: "/api/types",
    type: "POST",
    dataType: "json",
    success: function(data) {
      if (data === false) {
        console.log('ERROR: Server could not return a types list.');
        return;
      }
      types = data;
      //console.log(types);
    }, //end success
    error: function(err) { console.log(err); }
  }); //end ajax call
  //get servers object
  $.ajax({
    url: "/api/servers",
    type: "POST",
    dataType: "json",
    success: function(data) {
      if (data === false) {
        console.log('ERROR: Server could not return a valid servers list.');
        return;
      }
      servers = data;
      //console.log(servers);
    }, //end success
    error: function(err) { console.log(err); }
  }); //end ajax call

  $('#cmd').on('change', function() {
    $('#arg1').val('');
    $('#arg2').val('');
    $('#arg3').val('');

    if (this.value == 'servers') {

      $("label[for='arg1']").text('N/A:');
      $("#arg1").prop('disabled', true);
      $("label[for='arg2']").text('N/A:');
      $("#arg2").prop('disabled', true);
      $("label[for='arg3']").text('N/A:');
      $("#arg3").prop('disabled', true);

    } else if (this.value == 'hours') {

      $("label[for='arg1']").text('Name:');
      $("#arg1").prop('disabled', false);
      $("label[for='arg2']").text('Aircraft:');
      $("#arg2").prop('disabled', false);
      //select aircraft type
      //$("#arg2").remove();
      $("#arg2").replaceWith('<select id="arg2" name="arg2" class="form-control"></select>');
      types.hours.forEach(function(v) {
        v = v.replace(/[\s+]/gi, '');
        $("#arg2").append('<option value="'+v+'">'+v+'</option>');
      });
      $("label[for='arg3']").text('Server (optional):');
      $("#arg3").prop('disabled', false);
      //server list
      $("#arg3").replaceWith('<select id="arg3" name="arg3" class="form-control"></select>');
      $("#arg3").append('<option value=""></option>');
      for (var k in servers) {
        $("#arg3").append('<option value="'+k+'">'+k+'</option>');
      }

    } else if (this.value == 'kills') {

      $("label[for='arg1']").text('Name:');
      $("#arg1").prop('disabled', false);
      $("label[for='arg2']").text('Object Type:');
      $("#arg2").prop('disabled', false);
      //select kill type
      //$("#arg2").remove();
      $("#arg2").replaceWith('<select id="arg2" name="arg2" class="form-control"></select>');
      types.kills.forEach(function(v) {
        v = v.replace(/[\s+]/gi, '');
        $("#arg2").append('<option value="'+v+'">'+v+'</option>');
      });
      $("label[for='arg3']").text('Server (optional):');
      $("#arg3").prop('disabled', false);
      //server list
      $("#arg3").replaceWith('<select id="arg3" name="arg3" class="form-control"></select>');
      $("#arg3").append('<option value=""></option>');
      for (var k in servers) {
        $("#arg3").append('<option value="'+k+'">'+k+'</option>');
      }

    } else if (this.value == 'deaths') {

      $("label[for='arg1']").text('Name:');
      $("#arg1").prop('disabled', false);
      $("label[for='arg2']").text('Server (optional):');
      //input server
      $("#arg2").replaceWith('<select id="arg2" name="arg2" class="form-control"></select>');
      $("#arg2").append('<option value=""></option>');
      for (var k in servers) {
        $("#arg2").append('<option value="'+k+'">'+k+'</option>');
      }
      $("label[for='arg3']").text('N/A:');
      $("#arg3").prop('disabled', true);
    }
  });

  $('#run').click(function (e) {
    e.preventDefault();
    if (!['hours','servers','kills','deaths'].includes($('#cmd').val())) {
      console.log("ERROR: Please Choose a Command.");
      $('#json-tree').html('<div class="alert alert-danger">Choose a Command</div>');
      $('#json-tree').css({'visibility':'visible'});
      return false;
    }
    var command = $('#cmd option:selected').text();
    if ($('#arg1').val()) { command += (' '+$('#arg1').val()); }
    if ($('#arg2').val()) { command += (' '+$('#arg2').val()); }
    if ($('#arg3').val()) { command += (' '+$('#arg3').val()); }

    $.ajax({
      url: "/api/"+$('#cmd').val(),
      type: "POST",
      dataType: "json",
      data: {'command':command},
      success: function(data) {
        if (data === false) {
          console.log('ERROR: Server could not return a valid database object.');
          return;
        }
        $('#json-tree').jsonViewer(data);
        $('#json-tree').css({'visibility':'visible'});
      }, //end success
      error: function(err) { console.log(err); }
    }); //end ajax call
  });




});
