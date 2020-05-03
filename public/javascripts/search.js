$('#menus-search').on('input', function() {
  var search = $(this).serialize();
  if(search === "search=") {
    search = "all"
  }
  $("#paging").css("display","none");
  $.get('/menus?' + search, function(data) {
    $('#menus-grid').html('');
    data.forEach(function(menu) {

      
        $('#menus-grid').append(`
        <div class="md-col-4" style="margin-left: 5%">
          <a href="../../menus/${ menu._id }">
            <img src="../images/${ menu.image }" style="width:300px; height:300px;"/>
          </a>
            
            <p class="caption" style="text-align: center; font-size: 1.2rem">
              <a href="../../menus/${ menu._id }" class="caption">${ menu.name }</a>
            </p>
        </div>
      `);
      
      
    });
  });
});

$('#menus-search').submit(function(event) {
  event.preventDefault();
});


