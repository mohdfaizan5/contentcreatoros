import type { Metadata } from 'next';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
	title: 'Brand Visuals | ContentCreatorOS',
	description: 'Visual styleboard for icon, palette, and promo directions.',
};

type VisualPalette = {
	name: string;
	primary: string;
	secondary: string;
	background: string;
	foreground: string;
	swatches: [string, string, string, string, string];
};

const palettes: VisualPalette[] = [
	{
		name: 'Sunset Freight',
		primary: '#D45D33',
		secondary: '#1F6A58',
		background: '#070B12',
		foreground: '#F5F7FA',
		swatches: ['#D45D33', '#D97856', '#D98B71', '#9AAEA8', '#53756D'],
	},
	{
		name: 'Electric Marine',
		primary: '#2F7EF7',
		secondary: '#0E7B76',
		background: '#050A13',
		foreground: '#EEF4FF',
		swatches: ['#2F7EF7', '#4D98FA', '#73B5FF', '#8ACCC7', '#3F8D88'],
	},
	{
		name: 'Amber Studio',
		primary: '#D36A1D',
		secondary: '#4E5F90',
		background: '#0B0A10',
		foreground: '#FFF5E9',
		swatches: ['#D36A1D', '#E18A46', '#ECB26B', '#8E9FC8', '#5C6E9A'],
	},
];

function hexToRgba(hex: string, alpha: number) {
	const normalized = hex.replace('#', '');
	if (normalized.length !== 6) {
		return `rgba(0, 0, 0, ${alpha})`;
	}

	const r = parseInt(normalized.slice(0, 2), 16);
	const g = parseInt(normalized.slice(2, 4), 16);
	const b = parseInt(normalized.slice(4, 6), 16);

	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function Panel({
	className,
	style,
	children,
}: {
	className?: string;
	style?: React.CSSProperties;
	children: React.ReactNode;
}) {
	return (
		<section
			className={cn(
				'overflow-hidden rounded-[22px] border shadow-[0_20px_55px_-30px_rgba(0,0,0,0.55)]',
				className,
			)}
			style={style}
		>
			{children}
		</section>
	);
}

export default function BrandVisualsPage() {
	// Change the index to preview another theme quickly.
	const theme = palettes[0];

	return (
		<div className="mx-auto max-w-310 space-y-5">
			<header className="animate-fade-in-up space-y-2">
				<p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
					Brand Kit
				</p>
				<div className="flex flex-wrap items-end justify-between gap-3">
					<h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Visual Direction Board</h1>
					<p className="max-w-140 text-sm leading-6 text-muted-foreground sm:text-base">
						A collage-inspired preview that mirrors your reference layout: product snapshots, palette
						studies, app icon language, and dark premium proof cards.
					</p>
				</div>
				<p className="text-xs font-medium text-muted-foreground/80">
					Active theme from palettes[0]: <span className="text-foreground">{theme.name}</span>
				</p>
			</header>

			<div
				className="relative isolate overflow-hidden rounded-[28px] border p-3 sm:p-4 lg:p-6"
				style={{
					backgroundColor: theme.background,
					borderColor: hexToRgba(theme.foreground, 0.2),
				}}
			>
				<div
					className="pointer-events-none absolute inset-0"
					style={{
						background: `radial-gradient(1200px 480px at 50% -10%, ${hexToRgba(theme.secondary, 0.4)}, transparent 70%)`,
					}}
				/>
				<div
					className="pointer-events-none absolute -bottom-24 left-1/2 h-72 w-[80%] -translate-x-1/2 rounded-full blur-3xl"
					style={{ backgroundColor: hexToRgba(theme.primary, 0.18) }}
				/>

				<div className="relative z-20 grid gap-3 lg:grid-cols-12 lg:gap-4">
					<Panel className="animate-fade-in-up border-slate-300 bg-white text-slate-900 lg:col-span-3">
						<div className="space-y-3 p-3 sm:p-3.5">
							<div className="rounded-[14px] bg-black px-4 py-3 text-xl font-medium text-white sm:text-3xl">
								<span
									className="mr-2 inline-block h-5 w-5 rounded-full align-middle sm:h-6 sm:w-6"
									style={{ backgroundColor: theme.primary }}
								/>
								Trukon
							</div>

							<div className="grid grid-cols-2 gap-2">
								<div className="rounded-[12px] bg-[#12161f] p-2 text-[10px] text-slate-300 sm:text-[11px]">
									<div className="mb-2 text-slate-100">Tracking History</div>
									<div className="rounded-lg bg-[#1e2432] p-2">
										<div className="h-8 w-full rounded bg-[linear-gradient(120deg,#1f2937,#334155)]" />
										<div className="mt-2 h-1.5 w-4/5 rounded-full bg-orange-500/80" />
									</div>
								</div>
								<div
									className="rounded-[12px] p-2"
									style={{
										background: `linear-gradient(145deg, ${theme.swatches[1]}, ${theme.primary})`,
									}}
								>
									<div className="h-full rounded-[10px] border border-white/50 bg-white/25" />
								</div>
							</div>

							<div
								className="rounded-[14px] p-3 text-white"
								style={{
									background: `linear-gradient(130deg, ${theme.swatches[0]}, ${theme.swatches[2]})`,
								}}
							>
								<p className="text-xs uppercase tracking-wide text-white/75">Shipments Delivered</p>
								<p className="mt-2 text-4xl font-semibold leading-none">20k+</p>
							</div>
						</div>
					</Panel>

					<Panel className="animate-fade-in-up animation-delay-200 border-slate-300 bg-white text-slate-900 lg:col-span-4">
						<div className="space-y-3 p-3 sm:p-3.5">
							<div className="rounded-2xl p-4 text-white" style={{ backgroundColor: theme.secondary }}>
								<div className="flex items-start justify-between gap-3">
									<p className="text-4xl font-semibold leading-none">Geist</p>
									<p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/70">Font Family</p>
								</div>
								<p className="mt-4 text-[11px] uppercase tracking-[0.12em] text-white/80">
									The brown fox jumps over the lazy dog cursive
								</p>
								<p className="mt-1 text-sm text-white/90">The brown fox jumps over the lazy dog cursive</p>
							</div>

							<div
								className="grid grid-cols-5 gap-1 rounded-2xl p-2"
								style={{ backgroundColor: theme.primary }}
							>
								{theme.swatches.map((color) => (
									<div key={color} className="h-16 rounded-xl" style={{ backgroundColor: color }} />
								))}
							</div>
						</div>
					</Panel>

					<Panel className="animate-fade-in-up animation-delay-400 border-slate-300 bg-white text-slate-900 lg:col-span-5">
						<div className="grid gap-2 p-3 sm:grid-cols-[1.7fr_1fr] sm:p-3.5">
							<div
								className="relative overflow-hidden rounded-2xl p-4 text-white sm:min-h-55"
								style={{
									background: `linear-gradient(135deg, ${theme.secondary}, ${theme.swatches[4]})`,
								}}
							>
								<p className="max-w-70 text-3xl leading-[1.1] text-white/75">
									<span className="font-semibold text-white">Orent</span> is a hassle-free car rental app,
									it makes the process simple.
								</p>
								<div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
									<span
										className="rounded-full px-3 py-1.5 font-medium"
										style={{ backgroundColor: theme.foreground, color: theme.background }}
									>
										Download Now
									</span>
									<span className="rounded-full border border-white/35 px-2.5 py-1.5">Play</span>
									<span className="rounded-full border border-white/35 px-2.5 py-1.5">App</span>
								</div>
								<div
									className="absolute -bottom-12 right-0 h-36 w-56 rounded-full blur-2xl"
									style={{ backgroundColor: hexToRgba(theme.swatches[3], 0.5) }}
								/>
								<div
									className="absolute bottom-0 right-2 h-32 w-44 rounded-t-[100px]"
									style={{ background: `linear-gradient(170deg, ${theme.swatches[3]}, ${theme.secondary})` }}
								/>
							</div>

							<div className="space-y-2">
								<div
									className="flex h-24 items-center justify-center rounded-2xl text-3xl font-semibold text-white"
									style={{ backgroundColor: theme.primary }}
								>
									orent
								</div>
								<div
									className="relative flex h-34.5 items-center justify-center rounded-2xl"
									style={{ backgroundColor: '#0b131f' }}
								>
									<div className="h-30.5 w-17.5 rounded-[20px] border border-slate-500/60 bg-slate-900 shadow-inner" />
									<div className="absolute top-8 grid grid-cols-3 gap-1.5">
										{Array.from({ length: 9 }).map((_, index) => (
											<span
												key={index}
												className="h-2.5 w-2.5 rounded-lg"
												style={{ backgroundColor: hexToRgba(theme.foreground, 0.65) }}
											/>
										))}
									</div>
								</div>
							</div>
						</div>
					</Panel>
				</div>

				<div
					className="relative z-10 mt-3 rounded-[26px] border p-3 shadow-[0_35px_90px_-60px_rgba(0,0,0,0.9)] sm:p-4 lg:-mt-6 lg:p-5"
					style={{
						backgroundColor: hexToRgba(theme.background, 0.95),
						borderColor: hexToRgba(theme.foreground, 0.12),
					}}
				>
					<div className="grid gap-3 sm:grid-cols-2">
						<Panel
							className="animate-fade-in-up animation-delay-600 text-white"
							style={{ borderColor: hexToRgba(theme.foreground, 0.08), backgroundColor: '#101721' }}
						>
							<div className="p-5">
								<p className="text-6xl font-semibold leading-none" style={{ color: theme.primary }}>
									140
								</p>
								<p className="mt-3 max-w-55 text-4xl leading-[1.05]" style={{ color: hexToRgba(theme.foreground, 0.88) }}>
									Finely-crafted app icons
								</p>
							</div>
						</Panel>

						<Panel
							className="animate-fade-in-up animation-delay-1000 text-white"
							style={{ borderColor: hexToRgba(theme.foreground, 0.08), backgroundColor: '#101721' }}
						>
							<div className="p-5">
								<div className="mb-5 flex gap-1.5">
									{[theme.background, theme.secondary, theme.primary, theme.foreground].map((color) => (
										<div
											key={color}
											className="flex h-9 w-10 items-center justify-center rounded-[10px]"
											style={{ backgroundColor: color }}
										>
											<span
												className="text-xs"
												style={{ color: color === theme.foreground ? theme.background : theme.foreground }}
											>
												&#9825;
											</span>
										</div>
									))}
								</div>
								<p className="max-w-62.5 text-4xl leading-[1.05]" style={{ color: hexToRgba(theme.foreground, 0.88) }}>
									4 aesthetic color themes
								</p>
							</div>
						</Panel>

						<Panel
							className="animate-fade-in-up animation-delay-2000 text-white sm:col-span-2"
							style={{ borderColor: hexToRgba(theme.foreground, 0.08), backgroundColor: '#101721' }}
						>
							<div className="relative overflow-hidden p-6 text-center sm:p-7">
								<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(560px_180px_at_50%_110%,rgba(255,255,255,0.08),transparent_80%)]" />
								<p className="text-lg tracking-[0.4em]" style={{ color: theme.primary }}>
									*****
								</p>
								<p className="mt-2 text-5xl font-semibold tracking-tight">gumroad</p>
								<p className="mt-2 text-3xl" style={{ color: hexToRgba(theme.foreground, 0.78) }}>
									400+ 5 star reviews
								</p>
							</div>
						</Panel>
					</div>
				</div>
			</div>
		</div>
	);
}
