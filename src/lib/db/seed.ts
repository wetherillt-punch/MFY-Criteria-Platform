import { db } from './index';
import { criterion } from './schema';

const sampleCriteria = [
  {
    criterionId: 'SEPSIS-2024-001',
    versionNumber: 1,
    title: 'Severe Sepsis Documentation',
    linkedPolicyId: 'POL-SEPSIS-001',
    author: 'system',
    status: 'Published' as const,
    changeReason: 'Initial creation',
    problemStatementJson: {
      problem_statement: 'Verify that severe sepsis diagnosis in the current encounter is supported by clinician-authored documentation explicitly stating severe sepsis or septic shock, with evidence of infection and organ dysfunction. Do not infer sepsis from vital signs, lab values, or treatment orders alone unless a clinician explicitly interprets these findings as indicating sepsis.',
      what_qualifies: [
        'Explicit mention of "severe sepsis" or "septic shock" in clinician documentation',
        'Documentation of both infection source AND organ dysfunction in current encounter',
        'Clinician interpretation of clinical findings as meeting sepsis criteria'
      ],
      exclusions: [
        'SIRS (Systemic Inflammatory Response Syndrome) without documented infection',
        'Sepsis without organ dysfunction (simple sepsis)',
        'Historical sepsis from prior encounter not documented in current encounter'
      ],
      record_review_priority: [
        'Progress notes (attending, resident, fellow)',
        'Emergency department notes',
        'Critical care notes',
        'Discharge summary'
      ],
      response_rules: {
        yes: 'Return YES when clinician explicitly documents severe sepsis or septic shock with supporting infection and organ dysfunction evidence in current encounter',
        maybe: 'Return MAYBE when documentation suggests sepsis with organ dysfunction but lacks explicit severe sepsis terminology, or when sepsis is documented but timeframe is unclear',
        no: 'Return NO when only SIRS, simple sepsis, or historical sepsis is documented, or when inference would be required from raw data without clinician interpretation'
      },
      keywords: {
        include: ['severe sepsis', 'septic shock', 'sepsis with organ dysfunction', 'septic', 'septicemia'],
        exclude: ['SIRS', 'systemic inflammatory response', 'r/o sepsis', 'rule out sepsis']
      },
      global_rules: [
        'Current encounter only - do not use documentation from prior admissions',
        'Clinician-authored documentation only - do not infer from orders, labs, or vitals',
        'Allow distributed documentation across multiple notes if consistent',
        'No inference from raw clinical data unless clinician explicitly interprets findings'
      ]
    }
  },
  {
    criterionId: 'MALNUTRITION-2024-002',
    versionNumber: 1,
    title: 'Acute Malnutrition Documentation',
    linkedPolicyId: 'POL-MALNUTRITION-001',
    author: 'system',
    status: 'Draft' as const,
    problemStatementJson: {
      problem_statement: 'Verify that acute malnutrition diagnosis in the current encounter is supported by clinician-authored documentation explicitly stating malnutrition with acute or severe qualifiers, supported by objective assessment. Do not infer malnutrition solely from low BMI, albumin, or weight loss without clinician interpretation.',
      what_qualifies: [
        'Explicit documentation of "acute malnutrition" or "severe malnutrition"',
        'Dietitian or physician assessment documenting malnutrition with severity',
        'Structured malnutrition assessment (ASPEN, AND-ASPEN, etc.)'
      ],
      exclusions: [
        'Chronic malnutrition without acute component',
        'Risk of malnutrition without confirmed diagnosis',
        'Weight loss or low BMI without malnutrition diagnosis',
        'Malnutrition documented only in prior encounters'
      ],
      record_review_priority: [
        'Dietitian notes and assessments',
        'Progress notes (attending physician)',
        'Consultation notes (nutrition, GI)',
        'Admission H&P'
      ],
      response_rules: {
        yes: 'Return YES when clinician or dietitian explicitly documents acute or severe malnutrition with supporting assessment in current encounter',
        maybe: 'Return MAYBE when malnutrition is documented but severity (acute/chronic) is unclear, or when assessment suggests malnutrition but diagnosis is not explicitly stated',
        no: 'Return NO when only nutritional risk, weight loss, or abnormal labs are present without malnutrition diagnosis, or when diagnosis is from prior encounter only'
      },
      keywords: {
        include: ['acute malnutrition', 'severe malnutrition', 'protein-calorie malnutrition', 'PCM', 'kwashiorkor', 'marasmus'],
        exclude: ['chronic malnutrition', 'at risk for malnutrition', 'possible malnutrition', 'r/o malnutrition']
      },
      global_rules: [
        'Current encounter documentation only',
        'Require clinician or dietitian authored diagnosis',
        'Allow distributed documentation if consistent across notes',
        'Do not infer from labs (albumin, prealbumin) or BMI alone'
      ]
    }
  }
];

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Clear existing data
    await db.delete(criterion);
    console.log('  ✓ Cleared existing criteria');

    // Insert sample criteria
    for (const crit of sampleCriteria) {
      await db.insert(criterion).values(crit);
      console.log(`  ✓ Created criterion: ${crit.criterionId}`);
    }

    console.log('✅ Seeding complete!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

// Run seed if called directly
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { seed };
