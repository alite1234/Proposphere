"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Reveal } from "@/components/Motion";

const input = "w-full rounded-lg px-3 py-2 border border-slate-200/50 text-slate-300 focus:outline-none focus:border-gold transition-colors";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState("");
  const [whatWeDo, setWhatWeDo] = useState("");
  const [whoWeServe, setWhoWeServe] = useState("");
  const [differentiators, setDifferentiators] = useState("");
  const [toneOfVoice, setToneOfVoice] = useState("Professional");

  const steps = [
    "Business Identity",
    "Brand Identity",
    "Profile & Positioning",
  ];

  const proceed = async () => {
    // Create business and profile
    const { error } = await supabase
      .from("businesses")
      .insert({ name: businessName });

    if (error) return;

    // Create business profile
    await supabase.from("business_profiles").insert({
      business_id: "", // will be set after business creation
      what_we_do: whatWeDo,
      who_we_serve: whoWeServe,
      differentiators,
      tone_of_voice: toneOfVoice,
    });

    router.push("/studio/new");
  };

  return (
    <div className="min-h-screen bg-gold-soft p-6">
      <Reveal className="rise rise-1">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Set Up Your Business</h2>

          <form
            className="glass rounded-2xl p-8 space-y-6"
            onSubmit={(e) => e.preventDefault()}
          >
            {step === 1 && (
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider">
                  Business Identity
                </h3>
                <p className="text-slate-400 text-sm mb-6">
                  Tell us about your business so we can personalize the experience.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-500 text-sm mb-2">
                      Business Name *
                    </label>
                    <input
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Gold Design Studio"
                      className={input}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-sm mb-2">
                      What do you do? *
                    </label>
                    <textarea
                      value={whatWeDo}
                      onChange={(e) => setWhatWeDo(e.target.value)}
                      placeholder="e.g. We help service providers win clients with AI-powered proposals"
                      rows={3}
                      className={input}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-sm mb-2">
                      Who do you serve? *
                    </label>
                    <textarea
                      value={whoWeServe}
                      onChange={(e) => setWhoWeServe(e.target.value)}
                      placeholder="e.g. Freelancers, consultants, agencies"
                      rows={3}
                      className={input}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-sm mb-2">
                      What makes you different? *
                    </label>
                    <textarea
                      value={differentiators}
                      onChange={(e) => setDifferentiators(e.target.value)}
                      placeholder="e.g. 10 years experience, money-back guarantee, exclusive methodologies"
                      rows={3}
                      className={input}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider">
                  Brand Identity
                </h3>
                <p className="text-slate-400 text-sm mb-6">
                  Configure your visual identity for proposals and documents.
                </p>
                <div className="grid grid-cols-2 gap-4 space-y-4">
                  <div>
                    <label className="block text-slate-500 text-sm mb-2">
                      Primary Color
                    </label>
                    <input
                      value="#d4af37"
                      className="field"
                      placeholder="#d4af37"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-sm mb-2">
                      Secondary Color
                    </label>
                    <input value="#8b7a45" className="field" placeholder="#8b7a45" />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-sm mb-2">
                      Accent Color
                    </label>
                    <input value="#f5d76e" className="field" placeholder="#f5d76e" />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-sm mb-2">
                      Tone of Voice
                    </label>
                    <select
                      value={toneOfVoice}
                      onChange={(e) => setToneOfVoice(e.target.value)}
                      className="field"
                    >
                      <option value="Professional">Professional</option>
                      <option value="Friendly">Friendly</option>
                      <option value="Persuasive">Persuasive</option>
                      <option value="Technical">Technical</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider">
                  Profile & Positioning
                </h3>
                <p className="text-slate-400 text-sm mb-6">
                  Complete your profile so the AI can generate better proposals.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-500 text-sm mb-2">
                      Typical Project Size
                    </label>
                    <select className={input}>
                      <option value="small">Small (under $5,000)</option>
                      <option value="medium">Medium ($5,000 - $25,000)</option>
                      <option value="large">Large (over $25,000)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 text-sm mb-2">
                      Preferred Communication Tone
                    </label>
                    <select className={input}>
                      <option value="Professional">Professional</option>
                      <option value="Casual">Casual</option>
                      <option value="Persuasive">Persuasive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 text-sm mb-2">
                      Geographic Service Area
                    </label>
                    <input value="" className={input} placeholder="e.g. United States, Europe" />
                  </div>
                </div>
                <div className="pt-6 border-t border-slate-200/50">
                  <button
                    type="submit"
                    className="btn-gold w-full py-3 rounded-lg font-medium text-slate-900 tracking-wider"
                  >
                    Complete Onboarding & Start Studio
                  </button>
                </div>
              </div>
            )}
          </form>

          {step < 3 && (
            <div className="mt-8 flex justify-between text-slate-400 text-xs">
              <span>Step {step} of {steps.length}</span>
              <span>{steps[step - 1]}</span>
            </div>
          )}
        </div>
      </Reveal>
    </div>
  );
}