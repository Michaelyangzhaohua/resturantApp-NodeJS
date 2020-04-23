$('#menus-search').on('input', function() {
  var search = $(this).serialize();
  if(search === "search=") {
    search = "all"
  }
  $.get('/menus?' + search, function(data) {
    $('#menus-grid').html('');
    data.forEach(function(menu) {

      
        $('#menus-grid').append(`
        <div class="col-md-4 col-sm-6">
          <div class="thumbnail">
          <a href="../../menus/${ menu._id }">
            <img src="../images/${ menu.image }" style="width:290px; height:230px;"/>
          </a>
            
            <p style="text-align: center; font-size: 1.2rem">
              <a href="../../menus/${ menu._id }" class="caption">${ menu.name }</a>
            </p>
          </div>
        </div>
      `);
      
      
    });
  });
});

$('#menus-search').submit(function(event) {
  event.preventDefault();
});