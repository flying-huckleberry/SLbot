$(document).ready(function() {

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
      $("label[for='arg3']").text('Server (optional):');
      $("#arg3").prop('disabled', false);
    } else if (this.value == 'kills') {
      $("label[for='arg1']").text('Name:');
      $("#arg1").prop('disabled', false);
      $("label[for='arg2']").text('Object Type:');
      $("#arg2").prop('disabled', false);
      $("label[for='arg3']").text('Server (optional):');
      $("#arg3").prop('disabled', false);
    } else if (this.value == 'deaths') {
      $("label[for='arg1']").text('Name:');
      $("#arg1").prop('disabled', false);
      $("label[for='arg2']").text('Server (optional):');
      $("#arg2").prop('disabled', false);
      $("label[for='arg3']").text('N/A:');
      $("#arg3").prop('disabled', true);
    }
  });

  $('#run').click(function (e) {
    e.preventDefault();
    if ($('#cmd').val() !== 'servers'
          && $('#cmd').val() !== 'hours'
          && $('#cmd').val() !== 'kills'
          && $('#cmd').val() !== 'deaths') {
      console.log("ERROR: Please Choose a Command.");
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
