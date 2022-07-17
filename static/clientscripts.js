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

let projects = [];

/**
 * Remove all projects on the page added by addProject().
 */
function clearProjects() {
  $("#project-container").html("");
  $("#auProjectSelect").html("");
  projects = [];
}

function primaryProjectStatsCalculation(project){
  let workEntryWords = project.work_entries.map(entry => entry.words_written).reduce((a, b) => a + b, 0);
  let currentWords = project.initial_word_count + workEntryWords;
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
        <div class="progress-bar progress-bar-striped bg-success progress-bar-animated" role="progressbar" aria-valuemin="0" aria-valuemax="100">
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

/**
 * Add a project to the list of project cards on the page.
 * @param {*} project The project structured returned by the API.
 */
function addProject(project) {
  // Add this project to the global list.
  projects.push(project);

  // Start with a card template.
  let card = $(`<div class="col col-12 col-md-6 col-lg-4 mb-4">
      <div class="card h-100">
        <a class="card-link stretched-link text-decoration-none" data-toggle="modal" data-target="#openProject" >
        <canvas class="chart"></canvas>
        <div class="card-body">
          <h5 class="card-title"></h5>
        </div>
        <div class="card-footer">
          <div class="progress">
            <div class="progress-bar progress-bar-striped bg-success progress-bar-animated" role="progressbar"
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
  let allWorkEntries = projects.map(project => project.work_entries).flat();
  drawWordCountGraph($("#overall-activity")[0], allWorkEntries, null);
}

function reloadProjects() {
  return $.ajax({"url": "/api/projects"}).then(projects => {
    clearProjects();

    // Add new cards.
    projects.forEach(addProject);
  });
}

// Load the project list from the API.
$(() => {
  reloadProjects();
});

// Set a submit handler for the add project modal.
$("#apModalForm").on("submit", () => {
  $.ajax({
    "url": "/api/projects/",
    "method": "POST",
    "contentType": "application/json",
    "data": JSON.stringify({
      "name": $("#apTitleInput").val(),
      "start_date": $("#apStartDateInput").val(),
      "deadline": $("#apDeadlineInput").val(),
      "initial_word_count": $("#apCurrentWCInput").val(),
      "goal_word_count": $("#apGoalInput").val(),
    })
  }).then(addProject).then(() => {
    $("#addProject").modal("hide");
  }).catch((request, textStatus, errorThrown) => {
    $("#addProjectError")
      .text(`Failed to create project: ${errorThrown}`)
      .css("display", "block");
  });

  // Prevent page reload.
  return false;
});

// Clear the add update form whenever the modal is hidden.
$("#addUpdate").on("hidden.bs.modal", () => $("#auModalForm")[0].reset());

// Set a submit handler for the add project modal.
$("#auModalForm").on("submit", () => {
  let projectID = parseInt($("#auProjectSelect").val());

  if (projectID == -1) {
    $("#addProjectError")
      .text(`Failed to log work: No project selected`)
      .css("display", "block");
  }

  $.ajax({
    "url": `/api/projects/${projectID}/work-entries/`,
    "method": "POST",
    "contentType": "application/json",
    "data": JSON.stringify({
      "date": $("#auDateInput").val(),
      "words_written": $("#auWordsWritten").val(),
      "comment": $("#auCommentsInput").val(),
    })
  }).then(() => {
    $("#addUpdate").modal("hide");
  }).catch((request, textStatus, errorThrown) => {
    $("#addUpdateError")
      .text(`Failed to add update: ${errorThrown}`)
      .css("display", "block");
  });

  // Prevent page reload.
  return false;
});

let charts = new Map();

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
    projects.forEach(entry => {
      workEntries.forEach(entry => {
        let ent = new Date(entry.date);
        let entDate = new Date(Date.UTC(ent.getFullYear(), ent.getMonth(), ent.getDate()));
        if (entDate.getTime() >= currNeg30.getTime() && entDate.getTime() <= currentDay.getTime()){
          count4AvgTotal += entry.words_written;
        }
      });
    });
    console.log(count4AvgTotal);
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

  let myChart = new Chart(element, {
    type: 'bar',
    data: {
      datasets: [{
        label: 'Written',
        data: data,
        backgroundColor: '#26c69d',
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

$("#exportData").on("click", () => {
  reloadProjects().then(() => {
    // Based on code from here: https://robkendal.co.uk/blog/2020-04-17-saving-text-to-client-side-file-using-vanilla-js

    // Create blob which contains the JSON file.
    const projectJson = JSON.stringify(projects);
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
  }).catch(() => {
    $("#main-error").html(`
      <div class="alert alert-danger alert-dismissible" role="alert">
        <div class="error-text"></div>
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
    `);
    $("#main-error .error-text").text("Failed to generate export data.");
  });
});
