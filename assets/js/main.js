document.addEventListener("DOMContentLoaded",function(){
 const form=document.querySelector("[data-search]"); if(!form)return;
 const pages=[
 ["South Korea","countries/south-korea.html","Country profile"],
 ["China","countries/china.html","Country profile"],
 ["Japan","countries/japan.html","Country profile"],
 ["East Asia","regions/east-asia.html","Regional overview"],
 ["Daily Affairs","daily-affairs/index.html","Briefings"],
 ["Research & Analysis","research/index.html","Policy research"]
 ];
 form.addEventListener("submit",function(e){
  e.preventDefault(); const q=form.querySelector("input").value.toLowerCase().trim();
  const found=pages.filter(x=>x.join(" ").toLowerCase().includes(q));
  document.querySelector("[data-results]").innerHTML=found.map(x=>'<a href="'+x[1]+'"><strong>'+x[0]+'</strong> · '+x[2]+'</a>').join("")||"<p>No matching pages yet. Try a country or region.</p>";
 });
});
