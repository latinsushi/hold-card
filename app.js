(function () {
  "use strict";

  var LICENSE_KEY = "holdCardLicense";

  function hasLicense() {
    var v = localStorage.getItem(LICENSE_KEY);
    return !!(v && String(v).trim());
  }

  (function captureLicense() {
    var params = new URLSearchParams(window.location.search);
    var q = params.get("license");
    if (q && String(q).trim()) {
      localStorage.setItem(LICENSE_KEY, String(q).trim());
    }
  })();

  (function markLicensed() {
    if (!hasLicense()) return;
    var note = document.getElementById("checkout-note");
    var btn = document.getElementById("checkout-btn");
    if (note) note.textContent = "Licensed. PDFs download without the free-version line.";
    if (btn) {
      btn.textContent = "You're in";
      btn.setAttribute("href", "#tool");
    }
  })();

  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var sel = btn.getAttribute("data-copy");
      var el = sel ? document.querySelector(sel) : null;
      if (!el) return;
      var text = (el.innerText || el.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
      copyText(text).then(function () {
        var old = btn.textContent;
        btn.textContent = "Copied";
        setTimeout(function () {
          btn.textContent = old;
        }, 1600);
      });
    });
  });

  var form = document.getElementById("hold-form");
  if (!form) return;

  var dateInput = form.elements.date;
  if (dateInput && !dateInput.value) {
    var now = new Date();
    var m = String(now.getMonth() + 1).padStart(2, "0");
    var d = String(now.getDate()).padStart(2, "0");
    dateInput.value = now.getFullYear() + "-" + m + "-" + d;
  }

  function num(name) {
    var el = form.elements[name];
    if (!el) return null;
    var raw = el.value;
    if (raw === "" || raw == null) return null;
    var v = parseFloat(raw);
    return Number.isFinite(v) ? v : null;
  }

  function val(name) {
    var el = form.elements[name];
    if (!el) return "";
    return String(el.value || "").trim();
  }

  function parseIso(iso) {
    if (!iso) return null;
    var parts = iso.split("-").map(Number);
    if (parts.length < 3 || !parts[0]) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function formatDate(iso) {
    var dt = parseIso(iso);
    if (!dt) return "";
    return dt.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  function daysLabel(n) {
    if (n == null) return "waiting on you";
    if (n === 0) return "waiting as of today";
    if (n === 1) return "1 day waiting";
    return n + " days waiting";
  }

  function stageLabel(stage) {
    if (stage === "second") return "Second hold note";
    if (stage === "last") return "Last polite hold note";
    return "First hold note";
  }

  function gather() {
    var days = num("daysWaiting");
    return {
      fromName: val("fromName") || "[Your name]",
      client: val("clientName") || "[Client]",
      project: val("projectName") || "[Project]",
      waitingOn: val("waitingOn") || "[What you need]",
      daysWaiting: days,
      daysLabel: daysLabel(days),
      originalDueDate: formatDate(val("originalDueDate")),
      newResumeNote: val("newResumeNote"),
      stage: form.elements.stage.value,
      tone: form.elements.tone.value,
      date: formatDate(val("date"))
    };
  }

  function buildEmail(data) {
    var dueBit = data.originalDueDate
      ? " The original due date was " + data.originalDueDate + "."
      : "";
    var waitBit =
      data.daysWaiting == null
        ? "I am currently waiting on items from your side."
        : "I have been waiting " + data.daysLabel.replace("waiting", "").trim() + " on items from your side.";
    if (data.daysWaiting == null) {
      waitBit = "I am currently waiting on items from your side.";
    } else if (data.daysWaiting === 0) {
      waitBit = "As of today, I am waiting on items from your side.";
    } else if (data.daysWaiting === 1) {
      waitBit = "I have been waiting 1 day on items from your side.";
    } else {
      waitBit = "I have been waiting " + data.daysWaiting + " days on items from your side.";
    }
    var need = "What I need: " + data.waitingOn + ".";
    var resume = data.newResumeNote
      ? data.newResumeNote
      : "The timeline resumes when you send what is listed above.";
    var subject;
    var body;

    if (data.stage === "last") {
      if (data.tone === "firm") {
        subject = data.project + " is on hold waiting on you";
        body = [
          "Hi " + data.client + ",",
          "",
          "I am writing again about " + data.project + "." + dueBit,
          waitBit,
          "",
          need,
          "",
          resume,
          "",
          "Please send the items above, or reply with a date when you can. Until then, the timeline stays on hold on my side so the delay is clear.",
          "This is a timeline hold note from me, not a contract change.",
          "",
          data.fromName
        ].join("\n");
      } else {
        subject = data.project + " is on hold waiting on you";
        body = [
          "Hi " + data.client + ",",
          "",
          "Checking in once more on " + data.project + "." + dueBit,
          waitBit,
          "",
          need,
          "",
          resume,
          "",
          "When you can send those, I will pick the work back up. Until then I am pausing the clock on my side so the wait is documented.",
          "This is a polite hold note, not a penalty or legal notice.",
          "",
          "Thanks,",
          data.fromName
        ].join("\n");
      }
    } else if (data.stage === "second") {
      if (data.tone === "firm") {
        subject = "Following up: " + data.project + " waiting on your side";
        body = [
          "Hi " + data.client + ",",
          "",
          "A short follow-up on " + data.project + "." + dueBit,
          waitBit,
          "",
          need,
          "",
          resume,
          "",
          "Please send what you can this week, or reply if something is blocking you. The timeline remains on hold until then.",
          "",
          "Thanks,",
          data.fromName
        ].join("\n");
      } else {
        subject = "Following up: " + data.project + " waiting on your side";
        body = [
          "Hi " + data.client + ",",
          "",
          "Hope you are well. A short follow-up on " + data.project + "." + dueBit,
          waitBit,
          "",
          need,
          "",
          resume,
          "",
          "Happy to jump back in as soon as those arrive. Thank you for sending them when you can.",
          "",
          "Thanks,",
          data.fromName
        ].join("\n");
      }
    } else {
      if (data.tone === "firm") {
        subject = data.project + ": timeline on hold pending your items";
        body = [
          "Hi " + data.client + ",",
          "",
          "I am pausing work on " + data.project + " until I have what I need from your side." + dueBit,
          waitBit,
          "",
          need,
          "",
          resume,
          "",
          "Please send the items above when you can, or reply if you need a different path.",
          "",
          data.fromName
        ].join("\n");
      } else {
        subject = data.project + ": timeline on hold pending your items";
        body = [
          "Hi " + data.client + ",",
          "",
          "Hope you are well. I am pausing work on " + data.project + " until I have what I need from your side." + dueBit,
          waitBit,
          "",
          need,
          "",
          resume,
          "",
          "Happy to resume as soon as those arrive. Thank you,",
          data.fromName
        ].join("\n");
      }
    }

    return { subject: subject, body: body };
  }

  function el(id) {
    return document.getElementById(id);
  }

  function render() {
    var data = gather();
    var email = buildEmail(data);
    el("notice-kicker").textContent = stageLabel(data.stage);
    el("notice-amount").textContent =
      data.daysWaiting == null ? "Waiting" : data.daysWaiting + (data.daysWaiting === 1 ? " day" : " days");
    el("notice-late").textContent =
      data.daysWaiting == null ? "Add days waiting" : data.daysLabel;
    el("preview-subject").textContent = "Subject: " + email.subject;
    el("preview-body").textContent = email.body;
  }

  function hint(msg) {
    el("action-hint").textContent = msg;
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () {
        return fallbackCopy(text);
      });
    }
    return fallbackCopy(text);
  }

  function fallbackCopy(text) {
    return new Promise(function (resolve) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch (e) {}
      ta.remove();
      resolve();
    });
  }

  form.addEventListener("input", render);
  form.addEventListener("change", render);

  el("fill-example").addEventListener("click", function () {
    form.elements.fromName.value = "Lumen Studio";
    form.elements.clientName.value = "Calder Goods";
    form.elements.projectName.value = "Brand site redesign";
    form.elements.waitingOn.value =
      "Final logo files in SVG, and written approval on the homepage copy";
    form.elements.daysWaiting.value = "9";
    form.elements.newResumeNote.value =
      "Timeline resumes when you send the final logo files and homepage approval";
    form.querySelector('input[name="stage"][value="first"]').checked = true;
    form.querySelector('input[name="tone"][value="firm"]').checked = true;
    var today = parseIso(val("date")) || new Date();
    var due = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5);
    function iso(dt) {
      var m = String(dt.getMonth() + 1).padStart(2, "0");
      var d = String(dt.getDate()).padStart(2, "0");
      return dt.getFullYear() + "-" + m + "-" + d;
    }
    form.elements.originalDueDate.value = iso(due);
    render();
    hint("Example loaded. Copy the email or download the PDF.");
  });

  el("copy-email").addEventListener("click", function () {
    var data = gather();
    var email = buildEmail(data);
    var text = "Subject: " + email.subject + "\n\n" + email.body;
    copyText(text).then(function () {
      hint("Copied. Paste it into your mail app.");
    });
  });

  el("download-pdf").addEventListener("click", function () {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      hint("PDF library did not load. Check your connection and try again.");
      return;
    }
    if (!val("fromName") || !val("clientName") || !val("projectName") || !val("waitingOn")) {
      hint("Fill name, client, project, and what you are waiting on first.");
      return;
    }
    if (num("daysWaiting") == null) {
      hint("Add days waiting so the hold has a number.");
      return;
    }
    makePdf(gather());
    hint(hasLicense() ? "PDF downloaded." : "PDF downloaded. Free version includes a small footer line.");
  });

  function makePdf(data) {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ unit: "pt", format: "letter" });
    var pageW = 612;
    var pageH = 792;
    var margin = 54;
    var width = pageW - margin * 2;
    var y = 50;
    var ink = [27, 23, 20];
    var muted = [111, 103, 94];
    var accent = [196, 53, 30];
    var rule = [212, 203, 189];
    var paper = [243, 238, 228];
    var footerTop = pageH - 56;
    var contentBottom = footerTop - 36;

    function setInk() {
      doc.setTextColor(ink[0], ink[1], ink[2]);
    }
    function setMuted() {
      doc.setTextColor(muted[0], muted[1], muted[2]);
    }

    doc.setFillColor(accent[0], accent[1], accent[2]);
    doc.rect(0, 0, 8, pageH, "F");

    doc.setFont("times", "italic");
    doc.setFontSize(11);
    setInk();
    doc.text("Hold Card", margin, y);

    y += 16;
    doc.setDrawColor(accent[0], accent[1], accent[2]);
    doc.setLineWidth(1.2);
    doc.line(margin, y, margin + 34, y);

    y += 28;
    doc.setFont("times", "bold");
    doc.setFontSize(26);
    doc.text("Timeline hold", margin, y);

    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setMuted();
    doc.text(stageLabel(data.stage).toUpperCase() + "  ·  NOT A CONTRACT CHANGE", margin, y + 14);

    y += 28;
    doc.setDrawColor(ink[0], ink[1], ink[2]);
    doc.setLineWidth(0.7);
    doc.line(margin, y, margin + width, y);

    y += 18;
    doc.setFillColor(paper[0], paper[1], paper[2]);
    doc.rect(margin, y, width, 64, "F");
    doc.setFont("times", "italic");
    doc.setFontSize(28);
    setInk();
    var big =
      data.daysWaiting == null
        ? "Waiting"
        : data.daysWaiting + (data.daysWaiting === 1 ? " day" : " days");
    doc.text(big, margin + 14, y + 38);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    setMuted();
    doc.text(data.daysLabel, margin + 14, y + 54);
    y += 84;

    var meta = [
      ["Date", data.date || ""],
      ["From", data.fromName],
      ["To", data.client],
      ["Project", data.project]
    ];
    if (data.originalDueDate) meta.push(["Original due", data.originalDueDate]);

    var colGap = 16;
    var colW = (width - colGap) / 2;
    var leftY = y;
    var rightY = y;
    meta.forEach(function (row, i) {
      var useLeft = i % 2 === 0;
      var x = useLeft ? margin : margin + colW + colGap;
      var yy = useLeft ? leftY : rightY;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      setMuted();
      doc.text(row[0].toUpperCase(), x, yy);
      doc.setFont("times", "normal");
      doc.setFontSize(11);
      setInk();
      var lines = doc.splitTextToSize(String(row[1]), colW);
      doc.text(lines, x, yy + 13);
      var next = yy + Math.max(28, lines.length * 13 + 16);
      if (useLeft) leftY = next;
      else rightY = next;
    });
    y = Math.max(leftY, rightY) + 4;

    doc.setDrawColor(rule[0], rule[1], rule[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + width, y);
    y += 22;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    setMuted();
    doc.text("WAITING ON", margin, y);
    y += 14;
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    setInk();
    var waitLines = doc.splitTextToSize(data.waitingOn, width);
    doc.text(waitLines, margin, y);
    y += waitLines.length * 14 + 16;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    setMuted();
    doc.text("WHEN THE CLOCK RESUMES", margin, y);
    y += 14;
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    setInk();
    var resumeText = data.newResumeNote
      ? data.newResumeNote
      : "Timeline resumes when the client sends what is listed above.";
    var resumeLines = doc.splitTextToSize(resumeText, width);
    doc.text(resumeLines, margin, y);
    y += resumeLines.length * 14 + 16;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    setMuted();
    doc.text("NOTE", margin, y);
    y += 14;
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    setInk();
    var note =
      "This is a timeline hold note. Work is paused on the sender's side while waiting on the items above. It is not a contract rewrite, not a penalty notice, and not legal advice.";
    var noteLines = doc.splitTextToSize(note, width);
    if (y + noteLines.length * 14 < contentBottom) {
      doc.text(noteLines, margin, y);
      y += noteLines.length * 14 + 16;
    }

    doc.setFont("times", "italic");
    doc.setFontSize(11);
    var ask = "Please send the items above when you can, or reply with a date.";
    var askLines = doc.splitTextToSize(ask, width);
    if (y + askLines.length * 14 < contentBottom) {
      doc.text(askLines, margin, y);
    }

    doc.setDrawColor(rule[0], rule[1], rule[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, footerTop, margin + width, footerTop);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setMuted();
    var footer =
      "Generated by Hold Card. A business document helper, not legal advice, not a contract rewrite. Built by an AI agent.";
    if (!hasLicense()) {
      footer += " Created with the free version of Hold Card.";
    }
    doc.text(doc.splitTextToSize(footer, width), margin, footerTop + 14);

    var safe =
      String(data.project || "hold")
        .replace(/[^\w]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40) || "hold";
    doc.save("timeline-hold-" + safe + ".pdf");
  }

  render();
})();
