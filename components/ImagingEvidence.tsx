'use client';

// The images in this panel are deliberately kept separate from the synthetic Maria chart.
// They are de-identified research examples, not Maria's scan and not evidence about her.

import { ModelCard } from './ModelCard';

export function ImagingEvidence({ reading }: { reading: boolean }) {
  return (
    <section className="imaging-evidence" aria-labelledby="imaging-evidence-title">
      <div className="imaging-evidence-head">
        <div>
          <span className="label-sig">◆ Imaging evidence &amp; model card</span>
          <h2 id="imaging-evidence-title">A real imaging pipeline, shown honestly.</h2>
        </div>
        <span className={`imaging-state ${reading ? 'is-reading' : ''}`}>
          {reading ? 'Radiomics re-read running' : 'Research evidence ready'}
        </span>
      </div>

      <p className="imaging-intro">
        Maria’s chart is synthetic. These are separate, de-identified research examples that show the data the model
        was tested on and the MRI workflow it is being built to support. They are never presented as Maria’s images.
      </p>
      <div className="research-cohorts" aria-label="Research cohorts represented in the demo">
        <span><b>133</b> UT-EndoMRI patients<br /><small>annotated pelvic MRI</small></span>
        <span><b>102</b> GLENDA surgical cases<br /><small>373 annotated lesion frames</small></span>
        <span><b>1,469</b> MMOTU ultrasound images<br /><small>generalization surface, not a reported result</small></span>
      </div>

      <div className="research-images">
        <figure className="research-figure">
          <div className="research-image mri-image">
            <img src="/datasets/ut-endomri-example.png" alt="De-identified pelvic MRI example from UT-EndoMRI" />
          </div>
          <figcaption>
            <b>UT-EndoMRI · pelvic MRI example</b>
            <span>Real, de-identified, multi-sequence MRI with manual labels. 133 endometriosis cases; used here to
              show the production MRI path, not as a reported accuracy result.</span>
          </figcaption>
        </figure>

        <figure className="research-figure">
          <div className="research-image glenda-image">
            <img src="/datasets/glenda-c135-frame.jpg" alt="De-identified laparoscopic frame from the GLENDA dataset" />
            <img className="mask" src="/datasets/glenda-c135-mask.png" alt="Reference lesion mask for the laparoscopic frame" />
            <span className="mask-label">reference annotation</span>
          </div>
          <figcaption>
            <b>GLENDA v1.5 · laparoscopy + mask</b>
            <span>Real endometriosis research frame and expert annotation. This is the optical dataset used for the
              reported frame-level validation below—not an MRI and not a patient diagnosis.</span>
          </figcaption>
        </figure>
      </div>

      <div className="model-explainer">
        <div>
          <span className="label-sig">What ran</span>
          <p><b>Image → texture features → Random Forest → review flag.</b> The classifier calculates first-order
            intensity and GLCM texture features, then scores a frame. The model supports a specialist’s review; it
            does not diagnose endometriosis or replace a radiologist.</p>
        </div>
        <div>
          <span className="label-sig">Why it matters to the patient</span>
          <p><b>One clear brief instead of starting over.</b> The call captures the symptom story, the chart explains
            the missing context, and imaging creates a concrete question a specialist can verify—plus an estimated
            covered next step.</p>
        </div>
      </div>

      <ModelCard />
      <p className="research-credit">
        Research images: UT-EndoMRI / Liang et al. (CC BY 4.0) and GLENDA / Leibetseder et al. (CC BY-NC 4.0;
        research/demo use only). The local demo retains source attribution and uses no real patient chart data.
      </p>
    </section>
  );
}
