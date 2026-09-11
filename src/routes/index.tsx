import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Eye, EyeOff, ImagePlus, LoaderCircle, RefreshCw, Sparkles, Star, Upload } from "lucide-react";
import { useRef, useState } from "react";

import starConstellation from "@/assets/stars-constellation.jpg";
import starCluster from "@/assets/stars-cluster.jpg";
import starNightSky from "@/assets/stars-night-sky.jpg";
import { Button } from "@/components/ui/button";
import { analyzeStars, type StarAnalysis } from "@/lib/star-analysis.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Starcount — AI Star Counter" },
      { name: "description", content: "Upload a night-sky photo and detect visible stars with an interactive AI-generated overlay." },
      { property: "og:title", content: "Starcount — AI Star Counter" },
      { property: "og:description", content: "Count and map visible stars from any night-sky image." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const samples = [
  { name: "Milky Way", src: starNightSky },
  { name: "Constellation", src: starConstellation },
  { name: "Star cluster", src: starCluster },
];

const initialSample = samples[0] ?? { name: "Milky Way", src: starNightSky };

async function imageToDataUrl(src: string) {
  const response = await fetch(src);
  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function Index() {
  const [image, setImage] = useState(initialSample.src);
  const [imageName, setImageName] = useState(initialSample.name);
  const [analysis, setAnalysis] = useState<StarAnalysis | null>(null);
  const [activeStar, setActiveStar] = useState<number | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const analyze = useServerFn(analyzeStars);

  const selectImage = (src: string, name: string) => {
    setImage(src);
    setImageName(name);
    setAnalysis(null);
    setError("");
    setActiveStar(null);
  };

  const handleUpload = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setError("Choose an image smaller than 12 MB.");
      return;
    }
    selectImage(URL.createObjectURL(file), file.name);
  };

  const runAnalysis = async () => {
    console.log("runAnalysis started");
    setIsAnalyzing(true);
    setError("");
    setAnalysis(null);
    try {
      const imageDataUrl = await imageToDataUrl(image);
      console.log("image converted", imageDataUrl.slice(0, 50));
      const result = await analyze({ data: { imageDataUrl } });
      console.log("analyze result", result);
      if (result.error || !result.analysis) throw new Error(result.error || "No analysis returned.");
      setAnalysis(result.analysis);
      setShowOverlay(true);
    } catch (caught) {
      console.error("runAnalysis error", caught);
      setError(caught instanceof Error ? caught.message : "The image could not be analyzed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground"><Star aria-hidden="true" className="size-5" /></span>
            <div><span className="block font-display text-xl leading-none">Starcount</span><span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Visual analysis lab</span></div>
          </div>
          <span className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex"><span className="size-1.5 rounded-full bg-success" />AI vision ready</span>
        </div>
      </header>

      <section className="mx-auto max-w-[1500px] px-5 pb-12 pt-8 sm:px-8 sm:pt-12">
        <div className="mb-8 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent-foreground">Night-sky observation / 01</p>
            <h1 className="max-w-3xl font-display text-4xl leading-[1.02] sm:text-6xl">Count every visible star.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">Upload a night-sky image or choose a sample field. AI locates distinct point sources and maps each detection back to the sky.</p>
          </div>
          <Button onClick={runAnalysis} disabled={isAnalyzing} size="lg" className="h-12 min-w-44 self-start lg:self-auto">
            {isAnalyzing ? <LoaderCircle className="animate-spin" /> : <Sparkles />}{isAnalyzing ? "Scanning sky…" : analysis ? "Count again" : "Count stars"}
          </Button>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">
            <div className="relative overflow-hidden rounded-lg border border-border bg-image-stage">
              <img src={image} alt={`Night-sky image: ${imageName}`} className="block aspect-[16/10] w-full object-cover" width={1280} height={800} />
              {analysis && showOverlay && (
                <svg className="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label={`${analysis.count} detected stars`}>
                  {analysis.detections.map((star) => {
                    const selected = activeStar === star.id;
                    const { center, radius } = star;
                    return <g key={star.id} onMouseEnter={() => setActiveStar(star.id)} onMouseLeave={() => setActiveStar(null)} className="cursor-pointer">
                      <circle cx={center.x} cy={center.y} r={selected ? radius * 1.6 : radius} vectorEffect="non-scaling-stroke" className={selected ? "star-ring star-ring-active" : "star-ring"} />
                      <circle cx={center.x} cy={center.y} r={selected ? 1.4 : 1.05} vectorEffect="non-scaling-stroke" className="star-core" />
                      <text x={center.x} y={center.y + radius + 2.6} textAnchor="middle" className="star-label">{star.id}</text>
                    </g>;
                  })}
                </svg>
              )}
              {isAnalyzing && <div className="absolute inset-0 grid place-items-center bg-image-stage/70 backdrop-blur-[2px]"><div className="text-center"><LoaderCircle className="mx-auto mb-3 size-7 animate-spin text-analysis" /><p className="text-sm font-semibold">Finding stars</p><p className="mt-1 text-xs text-muted-foreground">Scanning point sources</p></div></div>}
              <div className="absolute left-3 top-3 rounded bg-image-stage/90 px-2.5 py-1.5 text-xs font-medium shadow-sm backdrop-blur">{imageName}</div>
              {analysis && <Button variant="secondary" size="sm" onClick={() => setShowOverlay((value) => !value)} className="absolute right-3 top-3 shadow-sm">{showOverlay ? <EyeOff /> : <Eye />}{showOverlay ? "Hide map" : "Show map"}</Button>}
            </div>

            <div className="mt-4 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {samples.map((sample) => <button key={sample.name} onClick={() => selectImage(sample.src, sample.name)} aria-label={`Use ${sample.name} sample`} className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-md border-2 transition-colors ${image === sample.src ? "border-analysis" : "border-transparent hover:border-border"}`}><img src={sample.src} alt="" loading="lazy" className="size-full object-cover" width={1280} height={800} /><span className="absolute inset-x-0 bottom-0 bg-image-stage/85 py-1 text-[9px] font-semibold">{sample.name}</span></button>)}
              </div>
              <input ref={inputRef} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => handleUpload(event.target.files?.[0])} />
              <Button variant="outline" onClick={() => inputRef.current?.click()}><Upload />Upload image</Button>
            </div>
            {error && <div className="mt-4 flex items-start justify-between gap-4 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"><span>{error}</span><Button variant="ghost" size="sm" onClick={runAnalysis}><RefreshCw />Retry</Button></div>}
          </div>

          <aside className="border-t border-border pt-5 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
            {!analysis ? <div className="flex h-full min-h-72 flex-col justify-between">
              <div><div className="mb-5 grid size-12 place-items-center rounded-md border border-border bg-secondary"><ImagePlus className="text-muted-foreground" /></div><h2 className="font-display text-2xl">Analysis results</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Your count, confidence, and individual star detections will appear here.</p></div>
              <div className="mt-10 space-y-3 border-t border-border pt-5 text-xs text-muted-foreground"><p className="flex justify-between"><span>Accepted</span><strong className="text-foreground">JPG, PNG, WebP</strong></p><p className="flex justify-between"><span>Maximum size</span><strong className="text-foreground">12 MB</strong></p></div>
            </div> : <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Detection complete</p>
              <div className="mt-5 flex items-end justify-between border-b border-border pb-5"><div><span className="font-display text-7xl leading-none">{analysis.count}</span><p className="mt-2 text-sm font-medium">Visible stars</p></div><div className="text-right"><span className="font-display text-3xl">{Math.round(analysis.confidence * 100)}%</span><p className="text-xs text-muted-foreground">overall confidence</p></div></div>
              <p className="border-b border-border py-5 text-sm leading-6 text-muted-foreground">{analysis.summary}</p>
              <div className="mt-5 flex items-center justify-between"><h2 className="text-sm font-semibold">Detected stars</h2><span className="text-xs text-muted-foreground">Hover to locate</span></div>
              <div className="mt-3 max-h-[410px] space-y-1 overflow-y-auto pr-1">
                {analysis.detections.map((star) => <button key={star.id} onMouseEnter={() => setActiveStar(star.id)} onMouseLeave={() => setActiveStar(null)} onClick={() => setActiveStar(activeStar === star.id ? null : star.id)} className={`flex w-full items-center gap-3 rounded-md border px-3 py-3 text-left transition-colors ${activeStar === star.id ? "border-analysis bg-analysis/10" : "border-transparent hover:bg-secondary"}`}><span className="grid size-7 shrink-0 place-items-center rounded-full bg-analysis text-xs font-bold text-analysis-foreground">{star.id}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{star.label || `Star ${star.id}`}</span><span className="text-xs text-muted-foreground">{Math.round(star.center.x)},{Math.round(star.center.y)} center</span></span><span className="text-xs font-semibold tabular-nums">{Math.round(star.confidence * 100)}%</span></button>)}
              </div>
            </div>}
          </aside>
        </div>
      </section>
    </main>
  );
}
