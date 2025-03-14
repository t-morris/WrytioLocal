//Introduction Functions
// ------------

// As seen on https://codepen.io/Coding_Journey/pen/BEMgbX

const typedTextSpan = document.querySelector(".typed-text");
const cursorSpan = document.querySelector(".cursor");

const textArray = ["writers.", "poets.", "journalists.", "novelists.", "authors.", "songwriters."];
const typingDelay = 150;
const erasingDelay = 100;
const newTextDelay = 2000; // Delay between current and next text
let textArrayIndex = 0;
let charIndex = 0;

function type() {
  if (charIndex < textArray[textArrayIndex].length) {
    if(!cursorSpan.classList.contains("typing")) cursorSpan.classList.add("typing");
    typedTextSpan.textContent += textArray[textArrayIndex].charAt(charIndex);
    charIndex++;
    setTimeout(type, typingDelay);
  } 
  else {
    cursorSpan.classList.remove("typing");
  	setTimeout(erase, newTextDelay);
  }
}

function erase() {
	if (charIndex > 0) {
    if(!cursorSpan.classList.contains("typing")) cursorSpan.classList.add("typing");
    typedTextSpan.textContent = textArray[textArrayIndex].substring(0, charIndex-1);
    charIndex--;
    setTimeout(erase, erasingDelay);
  } 
  else {
    cursorSpan.classList.remove("typing");
    textArrayIndex++;
    if(textArrayIndex>=textArray.length) textArrayIndex=0;
    setTimeout(type, typingDelay + 1100);
  }
}

document.addEventListener("DOMContentLoaded", function() { // On DOM Load initiate the effect
  if(textArray.length) setTimeout(type, newTextDelay + 250);
});

//Vars
// ------------
let userdata = [{
  "theme": null,
  "colorise": null,
  "projects":[]
  }];
let storedUserdata =[];
let charts = new Map();

$("#openJsonFileForm").on("submit", () => {
  try{
    const fileSelector = document.getElementById('file-selector');
  let testfile = fileSelector.files[0];
  let fileReader = new FileReader();
  fileReader.readAsText(testfile);
  fileReader.onloadend = function() {
    let hank = JSON.parse(fileReader.result);
    // console.log(hank);
    $("#openJsonFile").modal("hide");
    // console.log("closed modal");
    clearProjectsAndStored();
    importProjectsJson(hank);
    importTheme();
    reloadProjects();
    hideShowGetStarted();
  };
  fileReader.onerror = function() {
    console.log(fileReader.error);
  }; 
  }catch{
    //Throw error if above code block fails.
    $("#main-error").html(`
      <div class="alert alert-danger alert-dismissible" role="alert">
        <div class="error-text"></div>
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
    `);
    $("#main-error .error-text").text("Failed to import data.");
  }
  return false;
});

function importProjectsJson(JsonLump){
  userdata = JsonLump;
}

function importTheme(){
  let desiredColor = userdata[0].colorise;
  var r = document.querySelector(':root');
  r.style.setProperty('--text_var', desiredColor);
  r.style.setProperty('--bg_var', desiredColor);
  if (userdata[0].theme == 0){
    themeToggleDark();
  } else {
    themeToggleLight();
  }
}

function hideShowGetStarted() {
  if (userdata[0].projects.length == 1){
    // $("#crossproject").html("");
    $("#crossproject").html(`
      <div class="card">
        <div class="card-header text-center main-light-text3"><h4>Cross-Project Count</h4></div>
        <div class="card-body text-center">
          <canvas id="overall-activity" class="chart"></canvas>
        </div>
      </div>
    `); 
  }
}

//Theme Functions
// ------------
function defaultTheme() {
  themeToggleLight();
  var r = document.querySelector(':root');
  r.style.setProperty('--text_var', '#8ABC50');
  r.style.setProperty('--bg_var', '#8ABC50');
  document.getElementById("setColorInput").value = '#8ABC50';
}
// Switch theme to dark, update icon and text of switch button to indicate switching to light.
function themeToggleDark(){
  userdata[0].theme = 0;
  let themeSheetDark = document.getElementById("themeStylesheetDark");
  let themeSheetLight = document.getElementById("themeStylesheetLight");
  themeSheetDark.rel="stylesheet";
  themeSheetLight.rel="preload";
}

// Switch theme to dark, update icon and text of switch button to indicate switching to dark.
function themeToggleLight(){
  userdata[0].theme = 1;
  let themeSheetDark = document.getElementById("themeStylesheetDark");
  let themeSheetLight = document.getElementById("themeStylesheetLight");
  themeSheetDark.rel="preload";
  themeSheetLight.rel="stylesheet";
}

$("#setColorInput").on("input", () => {
  var r = document.querySelector(':root');
  let desiredColor = $("#setColorInput").val()
  r.style.setProperty('--text_var', desiredColor);
  r.style.setProperty('--bg_var', desiredColor);
  userdata[0].colorise = desiredColor;
  reloadProjects();
});

//Clear and Reload Page
// ------------
//Remove all projects on the page added by addProject().
function clearProjects() {
  $("#project-container").html("");
  $("#auProjectSelect").html("");
  userdata = [];
  $("#canvasdiv").html("");
  $("#canvasdiv").html('<canvas id="overall-activity" class="chart"></canvas>');
}

function clearProjectsAndStored() {
  $("#project-container").html("");
  $("#auProjectSelect").html("");
  userdata = [];
  storedProjects = [];
}

//Data Manipulation 
// ------------

/*Script to auto calculate the words per day for the Add project modal.
Collect information from modal form and calculate words per day based
on remaining words/number of days. Note: dates are collected from field's \
valueAsdNumber and had to be converted frommilliseconds to days. Also 
rounds final words per day value up.*/
function updateEstimate(){
  let startDate = Date.parse($("#apStartDateInput").val());
  let deadline = Date.parse($("#apDeadlineInput").val());
  let goal = $("#apGoalInput").val();
  let current = $("#apCurrentWCInput").val();
  let estimate = ((goal-current)/((Math.floor((deadline - startDate))/(24*60*60))/1000));
  estimate = Math.ceil(estimate);
  $("#apWPDOutput").val(estimate);
}

/*Script to auto update the modal's forms to reflect a standard writing
project for Nanowrimo based on current date. The prefill is also called
whenever the modal is opened so that it resets any user changes (and
can allow for projects to be added one after the other without keeping
old senseless settings).*/
function resetAddProjectForm(){
  let startDate = new Date();
  let endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);
  $("#apTitleInput").val("");
  $("#apStartDateInput")[0].valueAsDate = startDate;
  $("#apDeadlineInput")[0].valueAsDate = endDate;
  $("#apGoalInput").val(50000);
  $("#apCurrentWCInput").val(0);
  updateEstimate();

  // Hide error message if previously displayed.
  $("#addProjectError")
    .text("")
    .css("display", "none");
}

function primaryProjectStatsCalculation(project){
  let workEntryWords = project.work_entries.map(entry => entry.words_written).reduce((a, b) => a + b, 0);
  let currentWords = project.initial_word_count + workEntryWords;
  // console.log("initial:" + project.initial_word_count + ", workentrytotal:" + workEntryWords + ", current:" + currentWords);
  // console.log(typeof(workEntryWords));
  // console.log(typeof(project.initial_word_count));
  let totalWords = project.goal_word_count;
  let progress = Math.floor((100 * currentWords) / totalWords);
  return {workEntryWords: workEntryWords, currentWords: currentWords, totalWords: totalWords, progress: progress};
}

function populateOpenProject(project) {
  // Start with the modal template.
  let modal = $(`
  <div class="modal fade" id="openProject" tabindex="-1" role="dialog" aria-labelledby="openProject" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title"></h5>
      </div>
    <div class="modal-body">
      <canvas class="chart"></canvas>
      <hr>
      <h5>Project Stats</h5>
      <div class="progress">
        <div class="progress-bar progress-bar-striped main-bg-color progress-bar-animated" role="progressbar" aria-valuemin="0" aria-valuemax="100">
          <span class="progress-text"></span>
        </div>
      </div>
      <table class="table statstable table-borderless">
        <thead>
        </thead>
        <tbody>
        <tr>
          <th>Current:</th>
          <td class="tableCurrentWords"></td>
          <th>Target:</th>
          <td class="tableTargetWords"></td>
        </tr>
        <tr>
          <th>Deadline:</th>
          <td class="tableDeadline"></td>
          <th class="tableFinishCountText"></th>
          <td class="tableDailyWordsToFinish"></td>
        </tr>
        </tbody>
      </table>
      <hr>
      <h5>Work Entries Log</h5>
      <table class="table entriestable table-sm">
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Words</th>
            <th scope="col">Comments</th>
          </tr>
        </thead>
        <tbody>
        </tbody>
      </table> 
    </div>
  </div>
  </div>
      `);
  // Add modal properties.
  modal.find(".modal-title")
    .text(project.name);
  // Add modal graph
  drawWordCountGraph(modal.find(".chart")[0], project.work_entries, project);
  // Add word count progress
  let projectStats = primaryProjectStatsCalculation(project);

  modal.find(".progress-bar")
    .attr("aria-valuenow", projectStats.progress)
    .css("width", `${projectStats.progress}%`);
  modal.find(".progress-text").text(`${projectStats.currentWords} / ${projectStats.totalWords}`);
  // Update Stats table
  let currentDate = new Date();
  let endDate = Date.parse(project.deadline);
  let daysRemaining = ((Math.floor((endDate-currentDate))/(24*60*60))/1000);
  let requiredWordsToMeetDeadline;
  let finishCountTexts;
  // If words exceed target set Daily to Finish to 0
  if (projectStats.totalWords<=projectStats.currentWords) {
    finishCountTexts = "Daily to Finish:";
    requiredWordsToMeetDeadline = 0;
  // If words doesn't exceed target and days remaining is positive calculate # per day to finish.
  } else if ((daysRemaining-1) >= 0) {
    requiredWordsToMeetDeadline = Math.ceil((projectStats.totalWords-projectStats.currentWords)/(daysRemaining-1));
    finishCountTexts = "Daily to Finish:";
  // Else give total required to complete the project since it is past the deadline.
  } else {
    finishCountTexts = "Total to Finish:";
    requiredWordsToMeetDeadline = (projectStats.totalWords-projectStats.currentWords);
  }
  modal.find(".tableCurrentWords").text(projectStats.currentWords);
  modal.find(".tableTargetWords").text(projectStats.totalWords);
  modal.find(".tableDeadline").text(endDate.toLocaleDateString());
  modal.find(".tableFinishCountText").text(finishCountTexts);
  modal.find(".tableDailyWordsToFinish").text(requiredWordsToMeetDeadline);
  // Generate wordcount table
  let table = modal.find(".entriestable")[0];
  for (let entry of project.work_entries) {
    let row = table.insertRow(-1);
    let date = row.insertCell(0);
    let words = row.insertCell(1);
    let comments = row.insertCell(2);
    date.innerText = entry.date;
    words.innerText = entry.words_written;
    comments.innerText = entry.comment;
  }
  // Show modal.
  $("#openprojectmodal").html("").append(modal);
}

//Add a project to the list of project cards on the page.
//@param {*} project The project structured returned by the API.
function addProject(project) {
  // Add this project to the global list.
  //projects.push(project);

  // Start with a card template.
  let card = $(`<div class="col col-12 col-md-6 col-lg-4 mb-4">
      <div class="card h-100">
        <a class="card-link stretched-link text-decoration-none" data-toggle="modal" data-target="#openProject" >
        
        <div class="card-body">
          <h5 class="card-title"></h5>
          <canvas class="chart"></canvas>
        </div>

        <div class="card-footer">
          <div class="progress">
            <div class="progress-bar progress-bar-striped main-bg-color progress-bar-animated" role="progressbar"
                aria-valuemin="0" aria-valuemax="100">
              <span class="progress-text"></span>
            </div>
          </div>
        </div>
        </a>
      </div>
    </div>`);
  // Add card title.
  card.find(".card-title").text(project.name);

  // Add word count progress
  let projectStats = primaryProjectStatsCalculation(project);

  card.find(".progress-bar")
    .attr("aria-valuenow", projectStats.progress)
    .css("width", `${projectStats.progress}%`);
  card.find(".progress-text").text(`${projectStats.currentWords} / ${projectStats.totalWords}`);

  drawWordCountGraph(card.find(".chart")[0], project.work_entries, project);

  card.find(".card-link")
    .on("click", () => populateOpenProject(project));
  // Add new card.
  $("#project-container").append(card);

  // Add this project to the dropdown in the log time modal.
  let option = $("<option></option>");
  option.val(project.id).text(project.name);
  $("#auProjectSelect").append(option);

  // Update the overall graph to include work logs from this project
  let allWorkEntries = userdata[0].projects.map(project => project.work_entries).flat();
  drawWordCountGraph($("#overall-activity")[0], allWorkEntries, null);
}

function findNewEntryId(projID){
  let pID = projID;
  let newID = 1;
  if (userdata[0].projects[pID].work_entries.length == 0) {
    newID = 0;
  } else {
    newID = 1;
    userdata[0].projects[pID].work_entries.forEach(entry => {
      if (entry.id > newID){
        newID = entry.id;
      }
    })
    newID++;
  return newID;
  }
}

function findNewProjectId(data){
  let newID = 1;
  if (userdata[0].projects.length == 0) {
    newID = 0;
  } else {
    newID = 0;
    userdata[0].projects.forEach(entry => {
      if (entry.id > newID){
        newID = entry.id;
      }
    })
    newID++;
  }
  return newID;
}

function reloadProjects() {
  if (userdata[0].projects.length == 0){
    // $("#crossproject").html("");
    $("#crossproject").html(`<div class="card-body text-center" >
    You've got no projects yet, add a project and entries using the <i class="fa fa-plus-circle" aria-hidden="true"></i> and <i class="fa fa-calendar-plus-o" aria-hidden="true"></i> controls in the top left, or <i class="fa fa-upload" aria-hidden="true"></i> import a .json file you already have.
  </div>`);
  } else {
    $("#crossproject").html(`<div class="card">
    <div class="card-header text-center main-light-text3"><h4>Cross-Project Count</h4></div>
    <div class="card-body text-center">
      <canvas id="overall-activity" class="chart"></canvas>
    </div>
  </div>`);
    // $("#crossproject").html("");
  }
  storedUserdata = userdata;
  clearProjects();
  userdata = storedUserdata;
  // Add new cards.
  userdata[0].projects.forEach(addProject);
  //});
}

$("#apModalForm").on("submit", () => {
  userdata[0].projects.push({
    "id": findNewProjectId(userdata),
    "name": $("#apTitleInput").val(),
    "start_date": $("#apStartDateInput").val(),
    "deadline": $("#apDeadlineInput").val(),
    "initial_word_count": parseInt($("#apCurrentWCInput").val()),
    "goal_word_count": parseInt($("#apGoalInput").val()),
    "work_entries":[],
  });
  $("#addProject").modal("hide");
  reloadProjects();
  // Prevent page reload.
  return false;
});

// Set a submit handler for the add update modal.
$("#auModalForm").on("submit", () => {
  let projectID = parseInt($("#auProjectSelect").val());
  if (projectID == -1) {
    $("#addProjectError")
      .text(`Failed to log work: No project selected`)
      .css("display", "block");
  }
  userdata[0].projects[projectID].work_entries.push({
    "id": findNewEntryId(projectID),
    "project": userdata[0].projects[projectID].name,
    "date": $("#auDateInput").val(),
    "words_written": parseInt($("#auWordsWritten").val()),
    "comment": $("#auCommentsInput").val(),
  });
  $("#addUpdate").modal("hide");
  reloadProjects();
  // Prevent page reload.
  return false;
});

function drawWordCountGraph(element, workEntries, project) {
  let now = new Date();
  let minDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - 30));
  let maxDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  let graphData = new Map();
  let cumulativeData = new Map();
  let trendlineData = new Map();
  let averageData = new Map();

  // Generate trend line for days still visible in current view - trend line will 'roll off' of screen
  // as completion date recedes into the past.
  if (project != null){
    let projectDeadline = Date.parse(project.deadline);
    let projectBeginning = Date.parse(project.start_date);
    let projectLength = Math.floor((projectDeadline-projectBeginning+1)/(24*60*60)/1000);
    let projectTarget = project.goal_word_count;
    for (i = 0; i <= projectLength; i++){
      let iterationDate = new Date(Date.UTC(projectBeginning.getFullYear(), projectBeginning.getMonth(), projectBeginning.getDate() - 1+i));
      let iterationDateText = iterationDate.getFullYear()+"-"+(iterationDate.getMonth()+1)+"-"+iterationDate.getDate();
      if (minDate.getTime() <= iterationDate.getTime() && maxDate.getTime() >= iterationDate.getTime()) {
        trendlineData.set(iterationDateText, Math.ceil(i*(projectTarget/projectLength)));
      }
    }
  }

  trendlineData = Array.from(trendlineData.entries());
  let trend = trendlineData.map(entry => {
    return {"t": entry[0], "y": entry[1]};
  });

  // Generate bar graph data (each day = sum of work entried for that day).
  workEntries.forEach(entry => {
    let date = new Date(entry.date);
    let ms = date.getTime();
    if (minDate.getTime() <= ms && maxDate.getTime() >= ms) {
      if (graphData.has(entry.date)) {
        graphData.set(entry.date, graphData.get(entry.date) + entry.words_written)
      } else {
        graphData.set(entry.date, entry.words_written);
      }
    }
  });

  graphData = Array.from(graphData.entries());
  let data = graphData.map(entry => {
    return {"t": entry[0], "y": entry[1]};
  });

  // Generate cumulative line graph for projects for days still visible (rolling graph).
  // 1: Get total of words for this project (create array and reduce to get total?)
  if (project != null){
    let countTotal = project.initial_word_count;
    workEntries.forEach(entry => {
      countTotal += entry.words_written;
    });
    // 2: forEach entry, if entry.date == currentDate add value to currentDate's total words.
    // where currentDate = maxDate-n where n is an iterator from 0-29 (our 30 days visible)
    let topEndTotal = countTotal;
    for (i = 0; i <= 29; i++){
      let nextDayStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - (i-1)));
      let dayStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - (i)));
      let thisDayCount = 0;
      // Generate total count of words written for day.
      workEntries.forEach(entry => {
        let ent = new Date(entry.date);
        let entDate = new Date(Date.UTC(ent.getFullYear(), ent.getMonth(), ent.getDate()));
        if (entDate.getTime() >= dayStart.getTime() && entDate.getTime() < nextDayStart.getTime()){
          thisDayCount += entry.words_written;
        }
      });
      // Provide count for end of day.
      cumulativeData.set(dayStart, topEndTotal);
      // 3: Get datapoint for currentDate by getting result of countTotal - (sum of values from maxDate, MaxDate-1, maxDate-2... maxDate-(n-1))
      // if currentDate == maxDate this should just be Total.
      topEndTotal -= thisDayCount;
    }
  }

  cumulativeData = Array.from(cumulativeData.entries());
    let cumulative = cumulativeData.map(entry => {
      return {"t": entry[0], "y": entry[1]};
    });

  // Generate average line for days still visible in current view.
  if (project == null){
    let currentDay = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    let currNeg30 = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - (29)));
    let count4AvgTotal = 0
    userdata[0].projects.forEach(entry => {
      workEntries.forEach(entry => {
        let ent = new Date(entry.date);
        let entDate = new Date(Date.UTC(ent.getFullYear(), ent.getMonth(), ent.getDate()));
        if (entDate.getTime() >= currNeg30.getTime() && entDate.getTime() <= currentDay.getTime()){
          count4AvgTotal += entry.words_written;
        }
      });
    });
    //console.log(count4AvgTotal);
    let averageDaily = count4AvgTotal/30;
    averageData.set(currentDay, averageDaily);
    averageData.set(currNeg30, averageDaily);
  }    

  averageData = Array.from(averageData.entries());
  let average = averageData.map(entry => {
    return {"t": entry[0], "y": entry[1]};
  });

  
  // Delete any existing 
  if (charts.has(element)) {
    charts.get(element).destroy();
  }
  //Get latest colour from navbar.
  let elements = document.getElementById('navbar');
  let style = window.getComputedStyle(elements);
  let barColor = style.backgroundColor;
  // console.log(barColor);
  let myChart = new Chart(element, {
    type: 'bar',
    data: {
      datasets: [{
        label: 'Written',
        data: data,
        backgroundColor: barColor,
        type: 'bar',
        order: 2
      },{
        label: 'Cumulative',
        data: cumulative,
        borderColor: '#C7264E',
        backgroundColor: '#C7264E',
        type: 'line',
        order: 1,
        fill: false,
        spanGaps: true,
        pointRadius: 1,
        lineTension: 0,
        borderWidth: 1
      },{
        label: 'Target',
        data: trend,
        borderColor: '#269FC7',
        backgroundColor: '#269FC7',
        type: 'line',
        order: 3,
        fill: false,
        spanGaps: true,
        pointRadius: 0,
        borderWidth: 1
      },{
        label: 'Daily Avg',
        data: average,
        borderColor: '#C7264E',
        backgroundColor: '#C7264E',
        type: 'line',
        order: 4,
        fill: false,
        spanGaps: true,
        pointRadius: 0,
        borderWidth: 1
      }],
    },
    options: {
      scales: {
        xAxes: [{
          type: 'time',
          time: {
              unit: 'day'
          },
          ticks: {
            min: minDate,
            max: maxDate
          }
        }],
        yAxes: [{
          ticks: {
            beginAtZero: true,
            maxTicksLimit: 5
          }
        }]
      },
      legend: {
        display: false
      }
    }
  });
  charts.set(element, myChart);
}

//Form Cleaning
// ------------
// Clear the add update form whenever the modal is hidden.
$("#addUpdate").on("hidden.bs.modal", () => $("#auModalForm")[0].reset());

// Clear the add openJson form whenever the modal is hidden.
$("#openJsonFile").on("hidden.bs.modal", () => $("#openJsonFileForm")[0].reset());

//Data Export
// ------------
$("#exportData").on("click", () => {
  try{
    reloadProjects();
    // Based on code from here: https://robkendal.co.uk/blog/2020-04-17-saving-text-to-client-side-file-using-vanilla-js
    // Create blob which contains the JSON file.
    const projectJson = JSON.stringify(userdata);
    // console.log(projectJson);
    const file = new Blob([projectJson], {type: "application/json"});
    // Build a fake link tag and "click" it.
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    const now = new Date();
    const dateStr = now.toString("yyyyMMddHHmmss") 
    a.download = `wrytio-data-${dateStr}.json`;
    a.click();
    // Clean up the object to save memory
    URL.revokeObjectURL(a.href);
  }catch{
    //Throw error if above code block fails.
    $("#main-error").html(`
      <div class="alert alert-danger alert-dismissible" role="alert">
        <div class="error-text"></div>
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
    `);
    $("#main-error .error-text").text("Failed to generate export data.");
  }
});


