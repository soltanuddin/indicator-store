const $=x=>document.getElementById(x);

$("menu").onclick=()=>$("links").classList.toggle("open");

document.querySelectorAll(".choose").forEach(b=>b.onclick=()=>{
  $("plan").value=b.dataset.plan;
  $("order").scrollIntoView({behavior:"smooth"});
});

$("orderForm").onsubmit=async e=>{
  e.preventDefault();

  const p={
    name:$("name").value,
    email:$("email").value,
    tradingview_username:$("tv").value,
    plan:$("plan").value,
    payment_method:$("payment").value,
    transaction_id:$("trx").value,
    message:$("message").value
  };

  try{
    const r=await fetch("/api/orders",{
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify(p)
    });

    const text=await r.text();

    if(!r.ok){
      throw Error(`HTTP ${r.status}: ${text || "Empty response"}`);
    }

    let d;

    try{
      d=JSON.parse(text);
    }catch{
      throw Error(`Invalid JSON response: ${text || "Empty response"}`);
    }

    $("orderResult").innerHTML=
      `<div class="result">
        <b>Order submitted ✅</b><br>
        Order ID: <strong>${esc(d.order_id)}</strong><br>
        Status: ${esc(d.status || "Pending")}
      </div>`;

  }catch(err){
    $("orderResult").innerHTML=
      `<div class="result">
        <b>API Error ❌</b><br>
        ${esc(err.message)}
      </div>`;
  }
};

$("statusForm").onsubmit=async e=>{
  e.preventDefault();

  try{
    const r=await fetch(
      "/api/orders/"+encodeURIComponent($("lookup").value)
    );

    const text=await r.text();

    if(!r.ok){
      throw Error(`HTTP ${r.status}: ${text || "Empty response"}`);
    }

    const d=JSON.parse(text);

    $("statusResult").innerHTML=
      `<div class="result">
        <b>${esc(d.order_id)}</b><br>
        Plan: ${esc(d.plan)}<br>
        Status: <strong>${esc(d.status)}</strong>
      </div>`;

  }catch(err){
    $("statusResult").innerHTML=
      `<div class="result">
        <b>Error ❌</b><br>
        ${esc(err.message)}
      </div>`;
  }
};

function esc(v){
  return String(v).replace(
    /[&<>"']/g,
    c=>({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#039;"
    }[c])
  );
}