document.getElementById("ojfFilePath").addEventListener("change", function() {
    var file_to_read = document.getElementById("ojfFilePath").files[0];
    var fileread = new FileReader();
    fileread.onload = function(e) {
      var content = e.target.result;
      // console.log(content);
      var intern = JSON.parse(content); // Array of Objects.
      console.log(intern); // You can index every object
    };
    fileread.readAsText(file_to_read);
  });








  $("#openJsonFile").on("submit", () => {
    //console.log("Attempting open file");
    //console.log(document.getElementById("ojfFilePath").files[0]);
    //document.getElementById("ojfFilePath").addEventListener("change", function() {
      var file_to_read = document.getElementById("ojfFilePath").files[0];
      var fileread = new FileReader();
      fileread.onload = function(e) {
        var content = e.target.result;
        //console.log(JSON.parse(content));
        projects = JSON.parse(content); // Array of Objects.
        //console.log(intern); // You can index every object
        //projects = intern;
        console.log(projects);
        
      };
      fileread.readAsText(file_to_read);
    //});
    //console.log("Attempt done.");
    //importProjectsJson();
    reloadProjects();
    
  });
  
  
  
  // We can deal with iframe uploads using this URL:
  var options = {iframe: {url: 'upload.php'}}
  // 'zone' is an ID but you can also give a DOM node:
  var zone = new FileDrop('zone', options)
  
  // Do something when a user chooses or drops a file:
  zone.event('send', function (files) {
    // FileList might contain multiple items.
    files.each(function (file) {
      // Send the file:
      file.sendTo('upload.php')
    })
  })
    //$("#openJsonFile").modal("hide");
  