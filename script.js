let width = 960,
  height = 400;

let svg = d3
  .select("#forceDiagram")
  .attr("viewBox", "0 0 " + width + " " + height);

// Load external data
const LINK_URL =
  "https://chi-loong.github.io/CSC3007/assignments/links-sample.json";
const CASES_URL =
  "https://chi-loong.github.io/CSC3007/assignments/cases-sample.json";

Promise.all([d3.json(LINK_URL), d3.json(CASES_URL)]).then((data) => {
  // Data preprocessing
  data[0].forEach((e) => {
    e.source = e.infector;
    e.target = e.infectee;
  });

  console.log(data[0]); //links
  console.log(data[1]); //cases

  agecolors = [
    "#e3342f",
    "f6993f",
    "#ffed4a",
    "#38c172",
    "#4dc0b5",
    "#3490dc",
    "#6574cd",
    "#9561e2",
    "#f66d9b",
  ];

  // Set the Scale
  var ageScale = d3.scaleQuantize([0, 90], agecolors);
  var genderScale = d3.scaleOrdinal(
    ["male", "female"],
    ["#084c61", " #db3a34"]
  );
  var vaccinationScale = d3.scaleOrdinal(
    ["no", "partial (1 dose)", "yes (2 doses)"],
    ["#ffd166", "#06d6a0", "#118ab2"]
  );

  //Markers
  svg
    .append("svg:defs")
    .append("svg:marker")
    .attr("id", "arrow")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 20)
    .attr("refY", -3.5)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .attr("markerUnits", "strokeWidth")
    .append("svg:path")
    .attr("d", "M0,-5L10,0L0,5")
    .attr("fill", "blue");

  // Link Path
  var linkpath = svg
    .append("g")
    .attr("id", "links")
    .selectAll("path")
    .data(data[0])
    .enter()
    .append("path")
    .attr("class", "link")
    .attr("fill", "none")
    .attr("stroke", "black")
    .style("stroke-width", 2)
    .attr("marker-end", "url(#arrow)");

  // Nodes
  var nodes = svg
    .append("g")
    .attr("id", "nodes")
    .selectAll("circle")
    .data(data[1])
    .enter()
    .append("g");

  // Circles
  var circle = nodes
    .append("circle")
    .attr("class", "circle")
    .attr("r", "15")
    .attr("fill", (d) => genderScale(d.gender))
    .on("mouseover", (event, d) => {
      d3.select(event.currentTarget)
        .style("stroke", "green")
        .style("stroke-width", 5);

      tooltip
        .html(
          "ID: " +
            d.id +
            "<br/>" +
            "Age: " +
            d.age +
            "<br/>" +
            "Gender: " +
            d.gender +
            "<br/>" +
            "Vaccinated: " +
            d.vaccinated
        )
        .style("opacity", 1)
        .style("left", event.pageX + "px")
        .style("top", event.pageY + "px");
    })
    .on("mouseout", (event, d) => {
      tooltip.style("opacity", 0);
      d3.select(event.currentTarget).style("stroke", "none");
    })
    .call(
      d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
    );

  // Images
  var image = nodes
    .append("image")
    .attr("xlink:href", (d) => {
      if (d.gender == "male") return "img/male.svg";
      else return "img/female.svg";
    })
    .attr("width", 15)
    .attr("height", 15)
    .attr("pointer-events", "none");

  // Force Simulation
  var simulation = d3
    .forceSimulation(data[1])
    .force("charge", d3.forceManyBody().strength(-200))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("x", d3.forceX().strength(0.2))
    .force(
      "y",
      d3
        .forceY()
        .y(height / 2)
        .strength(0.1)
    )
    .force(
      "link",
      d3
        .forceLink(data[0])
        .id((d) => d.id)
        .distance(30)
        .strength(0.9)
    )
    .on("tick", tick);

  // Drag Functionality
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  // Tick Function
  function tick() {
    linkpath.attr("d", (d) => {
      let dx = d.target.x - d.source.x,
        dy = d.target.y - d.source.y,
        dr = Math.sqrt(dx * dx + dy * dy);
      return (
        "M" +
        d.source.x +
        "," +
        d.source.y +
        "A" +
        dr +
        "," +
        dr +
        " 0 0 1 " +
        d.target.x +
        "," +
        d.target.y
      );
    });

    circle.attr("cx", (d) => d.x).attr("cy", (d) => d.y);

    image.attr("x", (d) => d.x - 7.5).attr("y", (d) => d.y - 7.5);
  }

  // Tooltip
  var tooltip = d3
    .select("body")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "3px solid black")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "10px")
    .style("position", "absolute");

  // Updating Function
  $("#option-selection").on("change", function (e) {
    console.log(this.value);
    circle.attr("fill", (d) => {
      if (this.value === "AgeStatus") {
        return ageScale(d.age);
      } else if (this.value === "VaccineStatus") {
        return vaccinationScale(d.vaccinated);
      } else if (this.value === "Gender") {
        return genderScale(d.gender);
      }
    });
  });
});
