const http = require('http');

const scenarios = [
  {
    name: '1. Assignment Extension Due to Sickness',
    input: {
      recipient: 'Professor',
      situation: 'Assignment Extension',
      tone: ['Respectful', 'Professional'],
      context: 'CS 101 Assignment 3',
      roughMessage: 'Prof I couldn\'t finish assignment 3 because I was sick yesterday. Can I get an extra 2 days?'
    }
  },
  {
    name: '2. Grade Disagreement',
    input: {
      recipient: 'Professor',
      situation: 'Raising an Issue or Disagreement',
      tone: ['Respectful', 'Confident'],
      context: 'ENG 202 Term Paper',
      roughMessage: 'Hey professor, you gave me a C on my paper but I think I deserve at least a B+. Please re-evaluate my paper.'
    }
  },
  {
    name: '3. Missing Exam / Makeup Request',
    input: {
      recipient: 'Professor',
      situation: 'Asking for Help or Feedback',
      tone: ['Respectful', 'Professional'],
      context: 'MATH 301 Midterm Exam',
      roughMessage: 'I missed the midterm exam this morning because my alarm didn\'t go off. Can I take a makeup exam?'
    }
  },
  {
    name: '4. Recommendation Letter Request',
    input: {
      recipient: 'Professor',
      situation: 'Asking for Help or Feedback',
      tone: ['Respectful', 'Professional'],
      context: 'Graduate School Application',
      roughMessage: 'Dr. Smith I need a letter of recommendation for grad school by next week. Let me know if you can write it.'
    }
  },
  {
    name: '5. Office Hours Appointment Request',
    input: {
      recipient: 'Professor',
      situation: 'Asking for Help or Feedback',
      tone: ['Respectful', 'Warm'],
      context: 'PHYS 102 Chapter 4 Problem Set',
      roughMessage: 'I don\'t understand chapter 4 at all. Are you free to meet today?'
    }
  },
  {
    name: '6. Declining Research Lab Spot',
    input: {
      recipient: 'Professor',
      situation: 'Declining a Request',
      tone: ['Respectful', 'Professional'],
      context: 'Summer Undergraduate Research Program',
      roughMessage: 'Thanks for offering me a spot in your lab but I accepted another offer so I can\'t join your project.'
    }
  },
  {
    name: '7. Reporting Group Member Non-participation',
    input: {
      recipient: 'Professor',
      situation: 'Raising an Issue or Disagreement',
      tone: ['Professional', 'Firm'],
      context: 'BUS 400 Group Presentation',
      roughMessage: 'Professor, my group partner John didn\'t do any work for our presentation. Don\'t dock my grade.'
    }
  },
  {
    name: '8. Apologizing for Disruption',
    input: {
      recipient: 'Professor',
      situation: 'Apologizing for a Mistake',
      tone: ['Respectful', 'Warm'],
      context: 'HIST 110 Lecture',
      roughMessage: 'Sorry for leaving class early today without telling you beforehand.'
    }
  },
  {
    name: '9. Clarifying Project Guidelines',
    input: {
      recipient: 'Professor',
      situation: 'Asking for Help or Feedback',
      tone: ['Respectful', 'Professional'],
      context: 'BIO 210 Final Report Format',
      roughMessage: 'The assignment instructions are confusing. Is the paper 5 pages double spaced or single spaced?'
    }
  },
  {
    name: '10. Inquiring About Extra Credit',
    input: {
      recipient: 'Professor',
      situation: 'Asking for Help or Feedback',
      tone: ['Respectful', 'Confident'],
      context: 'CHEM 101 Midterm Grade',
      roughMessage: 'Is there any extra credit work I can do to raise my grade from a C to a B before finals?'
    }
  }
];

function postAnalyze(scenario) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(scenario.input);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/analyze',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      },
      res => {
        let body = '';
        res.on('data', chunk => (body += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(body);
            resolve(json);
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function runQA() {
  console.log('--- STARTING SAY IT RIGHT 10-SCENARIO QA PASS ---\n');
  let passedCount = 0;

  for (const s of scenarios) {
    process.stdout.write(`Testing: ${s.name} ... `);
    try {
      const res = await postAnalyze(s);
      if (!res.success || !res.data) {
        console.log('❌ FAIL (API error or missing data)');
        continue;
      }

      const d = res.data;
      // QA Checks
      const hasIntent = typeof d.intent === 'string' && d.intent.length > 5;
      const hasScores = d.overallScore >= 0 && d.scores && typeof d.scores.respect === 'number';
      const hasStrengths = Array.isArray(d.strengths) && d.strengths.length > 0;
      const hasIssues = Array.isArray(d.issues) && d.issues.length > 0 && d.issues[0].problem && d.issues[0].why;
      const hasImproved = typeof d.improvedMessage === 'string' && d.improvedMessage.length > 10;
      const hasAlternatives = Array.isArray(d.alternatives) && d.alternatives.length >= 3;
      const hasTips = Array.isArray(d.communicationTips) && d.communicationTips.length > 0;

      if (hasIntent && hasScores && hasStrengths && hasIssues && hasImproved && hasAlternatives && hasTips) {
        console.log(`✅ PASS (Score: ${d.overallScore}/10 | Issues: ${d.issues.length} | Alt Tones: ${d.alternatives.length})`);
        passedCount++;
      } else {
        console.log('❌ FAIL (Validation structure incomplete)');
      }
    } catch (e) {
      console.log(`❌ FAIL (Network/Server Exception: ${e.message})`);
    }
  }

  console.log(`\nQA PASS RESULT: ${passedCount} / ${scenarios.length} scenarios passed!`);
  if (passedCount === scenarios.length) {
    console.log('🎉 100% QA PASS SUCCESSFUL!');
  } else {
    process.exit(1);
  }
}

runQA();
