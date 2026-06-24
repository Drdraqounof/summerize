"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useEmail } from "../providers";
import { getSessionItem } from "@/lib/client-session";
import { focusAreaOptions, createCustomFocusAreaId, parseCustomFocusAreaId, isCustomFocusAreaId } from "@/lib/onboarding";

const aiExperienceOptions = [
	{
		value: "never-used-ai",
		label: "No, this is new to me",
		description: "Keep setup and results simple.",
	},
	{
		value: "some-ai-experience",
		label: "A little bit",
		description: "I have tried AI tools before but do not use them every day.",
	},
	{
		value: "use-ai-regularly",
		label: "Yes, regularly",
		description: "I am comfortable with AI helping me triage and summarize email.",
	},
];

const assistantStyleOptions = [
	{
		value: "priority-only",
		label: "Only show what matters most",
		description: "Keep the inbox focused on important matches.",
	},
	{
		value: "smart-summaries",
		label: "Give quick summaries",
		description: "Show short summaries so I can scan messages faster.",
	},
	{
		value: "action-items",
		label: "Pull out action items",
		description: "Highlight follow-ups, deadlines, and next steps.",
	},
];

const notificationOptions = [
	{
		value: "hourly",
		label: "Hourly",
		description: "Best when you want fresh matches grouped throughout the day.",
	},
	{
		value: "daily",
		label: "Daily",
		description: "A single digest for the most important matches each day.",
	},
	{
		value: "weekly",
		label: "Weekly",
		description: "A lighter summary of matches for weekly planning.",
	},
];

export default function QuestionsPage() {
	const router = useRouter();
	const { isLoggedIn, onboardingAnswers, saveOnboardingAnswers } = useEmail();
	const justSubmitted = useRef(false);
	const [step, setStep] = useState(1);
	const [hasUsedAiBefore, setHasUsedAiBefore] = useState(onboardingAnswers?.hasUsedAiBefore ?? "");
	const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>(
		onboardingAnswers?.selectedFocusAreas ?? []
	);
	const [assistantStyle, setAssistantStyle] = useState(onboardingAnswers?.assistantStyle ?? "");
	const [notificationFrequency, setNotificationFrequency] = useState(
		onboardingAnswers?.notificationFrequency ?? ""
	);
	const [showCustomForm, setShowCustomForm] = useState(false);
	const [customLabel, setCustomLabel] = useState("");
	const [customKeywords, setCustomKeywords] = useState("");
	const [error, setError] = useState("");

	useEffect(() => {
		if (!isLoggedIn && !getSessionItem("emailUser")) {
			router.replace("/login");
		}
	}, [isLoggedIn, router]);

	useEffect(() => {
		if (onboardingAnswers && justSubmitted.current) {
			window.location.href = "/api/google/auth";
		}
	}, [onboardingAnswers]);

	const toggleFocusArea = (focusId: string) => {
		setSelectedFocusAreas((current) =>
			current.includes(focusId)
				? current.filter((value) => value !== focusId)
				: [...current, focusId]
		);
	};

	const handleNext = () => {
		setError("");

		if (!hasUsedAiBefore) {
			setError("Tell us whether you have used AI before.");
			return;
		}

		if (selectedFocusAreas.length === 0) {
			setError("Pick at least one email category.");
			return;
		}

		if (!assistantStyle) {
			setError("Choose how you want Mailturtle to help.");
			return;
		}

		setStep(2);
	};

	const handleSubmit = async () => {
		setError("");

		if (!notificationFrequency) {
			setError("Choose how often you want notifications.");
			return;
		}

		try {
			await saveOnboardingAnswers({
				hasUsedAiBefore,
				selectedFocusAreas,
				assistantStyle,
				notificationFrequency,
			});

			window.location.href = "/api/google/auth";
		} catch (saveError) {
			setError(saveError instanceof Error ? saveError.message : "Unable to save your answers.");
		}
	};

	return (
		<div className="min-h-screen bg-[#f0ffea] px-4 py-12 sm:py-16 sm:px-6 lg:px-8">
			<div className="mx-auto max-w-5xl rounded-[1.5rem] sm:rounded-[2rem] border border-green-200 bg-white/85 p-6 sm:p-8 lg:p-10 shadow-xl shadow-green-100 backdrop-blur">
				<div className="mb-6 sm:mb-8 flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-end lg:justify-between">
					<div>
						<p className="mb-2 sm:mb-3 inline-flex rounded-full bg-green-100 px-3 sm:px-4 py-1 text-xs sm:text-sm font-semibold text-green-800">
							Step {step} of 2
						</p>
						<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">
							{step === 1 ? "Tell us how you want Mailturtle to help" : "Choose your notification schedule"}
						</h1>
						<p className="mt-2 sm:mt-3 max-w-2xl text-xs sm:text-sm lg:text-base text-slate-700">
							{step === 1
								? "Answer four setup questions so returning sign-ins can skip this step and go straight into Gmail connection."
								: "Pick how often you want to be notified when matching emails are found."}
						</p>
					</div>
					<div className="rounded-[1.25rem] sm:rounded-[1.5rem] border border-green-200 bg-green-50 px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm text-slate-700">
						<p className="font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-green-700">Setup flow</p>
						<p className="mt-1 sm:mt-2 text-xs">Questions first, then Google inbox connection.</p>
					</div>
				</div>

				{step === 1 ? (
					<div className="space-y-8">
<div className="grid gap-2 sm:gap-3 md:grid-cols-2 xl:grid-cols-4">
					<div className="rounded-[1.25rem] sm:rounded-[1.5rem] border border-green-200 bg-green-50/80 p-3 sm:p-4 lg:p-5">
						<p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.15em] sm:tracking-[0.18em] text-green-700">Question 1</p>
						<p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-700">Have you used AI before?</p>
					</div>
					<div className="rounded-[1.25rem] sm:rounded-[1.5rem] border border-green-200 bg-white p-3 sm:p-4 lg:p-5">
						<p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.15em] sm:tracking-[0.18em] text-green-700">Question 2</p>
						<p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-700">Which emails matter most?</p>
					</div>
					<div className="rounded-[1.25rem] sm:rounded-[1.5rem] border border-green-200 bg-green-50/80 p-3 sm:p-4 lg:p-5">
						<p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.15em] sm:tracking-[0.18em] text-green-700">Question 3</p>
						<p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-700">How should Mailturtle help?</p>
					</div>
					<div className="rounded-[1.25rem] sm:rounded-[1.5rem] border border-green-200 bg-white p-3 sm:p-4 lg:p-5">
						<p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.15em] sm:tracking-[0.18em] text-green-700">Question 4</p>
						<p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-700">How often should notifications arrive?</p>
							</div>
						</div>

						<fieldset>
							<legend className="mb-3 block text-lg font-semibold text-slate-900">
								1. Have you used AI before?
							</legend>
							<div className="grid gap-3 md:grid-cols-3">
								{aiExperienceOptions.map((option) => (
									<label
										key={option.value}
										className={`cursor-pointer rounded-[1.5rem] border px-5 py-5 transition ${
											hasUsedAiBefore === option.value
												? "border-green-600 bg-green-100 text-slate-900"
												: "border-green-200 bg-white text-slate-700 hover:border-green-400 hover:bg-green-50"
										}`}
									>
										<input
											type="radio"
											name="hasUsedAiBefore"
											value={option.value}
											checked={hasUsedAiBefore === option.value}
											onChange={(event) => setHasUsedAiBefore(event.target.value)}
											className="sr-only"
										/>
										<p className="font-semibold text-slate-900">{option.label}</p>
										<p className="mt-2 text-sm leading-6 text-inherit">{option.description}</p>
									</label>
								))}
							</div>
						</fieldset>

						<fieldset>
							<legend className="mb-3 block text-lg font-semibold text-slate-900">
								2. Which email categories should get extra attention?
							</legend>
							<div className="grid gap-4 md:grid-cols-2">
								{focusAreaOptions.map((option) => {
									const selected = selectedFocusAreas.includes(option.id);

									return (
										<button
											key={option.id}
											type="button"
											onClick={() => toggleFocusArea(option.id)}
											className={`rounded-[1.5rem] border p-5 text-left transition ${
												selected
													? "border-green-600 bg-green-100 shadow-sm"
													: "border-green-200 bg-white hover:border-green-400 hover:bg-green-50"
											}`}
										>
											<p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
												{option.question}
											</p>
											<h2 className="mt-2 text-xl font-semibold text-slate-900">{option.label}</h2>
											<p className="mt-2 text-sm text-slate-700">{option.description}</p>
											<p className="mt-3 text-xs text-slate-500">Looks for: {option.signals.join(", ")}</p>
										</button>
									);
								})}

								{!showCustomForm ? (
									<button
										type="button"
										onClick={() => setShowCustomForm(true)}
										className="rounded-[1.5rem] border-2 border-dashed border-green-300 p-5 text-left transition hover:border-green-500 hover:bg-green-50 flex flex-col items-center justify-center min-h-[200px]"
									>
										<span className="text-3xl text-green-400">+</span>
										<p className="mt-2 text-sm font-semibold text-green-700">Custom Category</p>
										<p className="mt-1 text-xs text-slate-500">Create your own</p>
									</button>
								) : (
									<div className="rounded-[1.5rem] border border-green-400 bg-green-50 p-5">
										<p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-700 mb-3">New Custom Category</p>
										<div className="space-y-3">
											<div>
												<label className="block text-xs font-medium text-slate-700 mb-1">Category name</label>
												<input
													type="text"
													value={customLabel}
													onChange={(e) => setCustomLabel(e.target.value)}
													placeholder="e.g. Food, Clothes, Chicken Wings"
													className="w-full rounded-xl border border-green-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
												/>
											</div>
											<div>
												<label className="block text-xs font-medium text-slate-700 mb-1">Keywords to watch for (comma-separated)</label>
												<input
													type="text"
													value={customKeywords}
													onChange={(e) => setCustomKeywords(e.target.value)}
													placeholder="e.g. chicken, wings, recipe, meal"
													className="w-full rounded-xl border border-green-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
												/>
											</div>
											<div className="flex gap-2">
												<button
													type="button"
													onClick={() => {
														setShowCustomForm(false);
														setCustomLabel("");
														setCustomKeywords("");
													}}
													className="flex-1 rounded-xl border border-green-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-white transition"
												>
													Cancel
												</button>
												<button
													type="button"
													onClick={() => {
														const label = customLabel.trim();
														const keywords = customKeywords.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
														if (!label || keywords.length === 0) return;
														const id = createCustomFocusAreaId(label, keywords);
														toggleFocusArea(id);
														setShowCustomForm(false);
														setCustomLabel("");
														setCustomKeywords("");
													}}
													disabled={!customLabel.trim() || customKeywords.split(",").filter((s) => s.trim()).length === 0}
													className="flex-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 transition disabled:opacity-50"
												>
													Add Category
												</button>
											</div>
										</div>
									</div>
								)}
							</div>

							{selectedFocusAreas.filter((id) => isCustomFocusAreaId(id)).length > 0 && (
								<div className="flex flex-wrap gap-2 mt-2">
									{selectedFocusAreas.filter((id) => isCustomFocusAreaId(id)).map((id) => {
										const parsed = parseCustomFocusAreaId(id);
										if (!parsed) return null;
										return (
											<span key={id} className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-purple-100 text-purple-700">
												{parsed.label}
												<button
													type="button"
													onClick={() => toggleFocusArea(id)}
													className="hover:text-purple-900"
												>
													&times;
												</button>
											</span>
										);
									})}
								</div>
							)}
						</fieldset>

						<fieldset>
							<legend className="mb-3 block text-lg font-semibold text-slate-900">
								3. How should Mailturtle help once emails are pulled in?
							</legend>
							<div className="grid gap-3 md:grid-cols-3">
								{assistantStyleOptions.map((option) => (
									<label
										key={option.value}
										className={`cursor-pointer rounded-[1.5rem] border px-5 py-5 transition ${
											assistantStyle === option.value
												? "border-green-600 bg-green-100 text-slate-900"
												: "border-green-200 bg-white text-slate-700 hover:border-green-400 hover:bg-green-50"
										}`}
									>
										<input
											type="radio"
											name="assistantStyle"
											value={option.value}
											checked={assistantStyle === option.value}
											onChange={(event) => setAssistantStyle(event.target.value)}
											className="sr-only"
										/>
										<p className="font-semibold text-slate-900">{option.label}</p>
										<p className="mt-2 text-sm leading-6 text-inherit">{option.description}</p>
									</label>
								))}
							</div>
						</fieldset>

					{error ? <div className="rounded-xl sm:rounded-2xl bg-red-50 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-red-700">{error}</div> : null}

					<div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
						<p className="text-xs sm:text-sm text-slate-600">Next you will choose whether matching notifications arrive hourly, daily, or weekly.</p>
						<button
							type="button"
							onClick={handleNext}
							className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-green-600 to-emerald-600 px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base font-semibold text-white transition hover:from-green-700 hover:to-emerald-700 whitespace-nowrap"
							>
								Continue to Notifications
							</button>
						</div>
					</div>
				) : (
					<div className="space-y-8">
						<div className="grid gap-4 md:grid-cols-3">
							{notificationOptions.map((option) => (
								<label
									key={option.value}
									className={`cursor-pointer rounded-[1.75rem] border px-6 py-6 transition ${
										notificationFrequency === option.value
											? "border-green-600 bg-green-100 shadow-lg shadow-green-100"
											: "border-green-200 bg-white hover:border-green-400 hover:bg-green-50"
									}`}
								>
									<input
										type="radio"
										name="notificationFrequency"
										value={option.value}
										checked={notificationFrequency === option.value}
										onChange={(event) => setNotificationFrequency(event.target.value)}
										className="sr-only"
									/>
									<p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">Notifications</p>
									<h2 className="mt-2 text-2xl font-bold text-slate-900">{option.label}</h2>
									<p className="mt-3 text-sm leading-6 text-slate-700">{option.description}</p>
								</label>
							))}
						</div>

						<div className="rounded-[1.5rem] border border-green-200 bg-green-50/80 p-6 text-sm leading-7 text-slate-700">
							<p className="font-semibold uppercase tracking-[0.2em] text-green-700">Summary</p>
							<p className="mt-3">Once this is saved, future sign-ins can skip the questions and go directly into Gmail connection.</p>
						</div>

						{error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

						<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<button
								type="button"
								onClick={() => {
									setError("");
									setStep(1);
								}}
								className="inline-flex items-center justify-center rounded-full border border-green-300 px-6 py-3 font-semibold text-green-800 transition hover:bg-green-50"
							>
								Back to Questions
							</button>
							<button
								type="button"
								onClick={handleSubmit}
								className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-3 font-semibold text-white transition hover:from-green-700 hover:to-emerald-700"
							>
								Save and Connect Gmail
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
