import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Download,
  FileSearch,
  Layers3,
  Mail,
  MessageSquareMore,
  Mic,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Video,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";
import { BlurFade } from "@/components/ui/blur-fade";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { OrbitingCircles } from "@/components/ui/orbiting-circles";
import { Separator } from "@/components/ui/separator";
import { apkDownloadUrl, supportEmail, supportEmailHref } from "@/lib/publicConfig";

const navLinks = [
  { href: "#how-it-helps", label: "How it helps" },
  { href: "#premium", label: "Premium" },
  { href: "#coming-next", label: "Coming next" },
  { href: "#support", label: "Support" },
];

const quickNotes = [
  "3 free interview rounds each day",
  "Saved interview drafts on the same device",
  "Resume feedback built for ATS cleanup",
  "Premium unlocks only after payment confirmation",
];

const roadmapCards = [
  {
    description:
      "A spoken-answer mode for candidates who want to rehearse delivery, confidence, and pacing.",
    icon: Mic,
    label: "Private testing",
    title: "Voice practice",
  },
  {
    description:
      "A more natural face-to-face round once the voice flow feels stable across real devices.",
    icon: Video,
    label: "Planned next",
    title: "Video interview mode",
  },
  {
    description:
      "A smoother interviewer readout so practice rounds feel closer to a real conversation.",
    icon: Sparkles,
    label: "On the roadmap",
    title: "Guided interviewer flow",
  },
];

function OrbitHero() {
  return (
    <div className="relative mx-auto flex w-full max-w-[660px] items-center justify-center">
      <div className="glass relative flex h-[29rem] w-full items-center justify-center overflow-hidden rounded-[2.4rem] border-white/25 bg-white/60 p-6 shadow-[0_30px_120px_rgba(76,29,149,0.16)] dark:bg-slate-950/55">
        <AnimatedGridPattern
          className="absolute inset-0 opacity-35 [mask-image:radial-gradient(380px_circle_at_center,white,transparent)]"
          duration={5}
          maxOpacity={0.18}
          numSquares={36}
          repeatDelay={1}
        />

        <div className="relative flex size-full items-center justify-center px-12 py-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.16),transparent_34%),radial-gradient(circle_at_center,rgba(34,211,238,0.12),transparent_58%)]" />

          <div className="relative z-10 flex size-[13rem] items-center justify-center rounded-full border border-white/20 bg-white/70 shadow-[0_24px_80px_rgba(14,116,144,0.14)] backdrop-blur-2xl dark:bg-slate-950/68 sm:size-[14rem]">
            <div className="absolute inset-5 rounded-full border border-violet-300/35 dark:border-violet-500/20" />
            <div className="absolute inset-10 rounded-full border border-cyan-300/35 dark:border-cyan-500/20" />

            <OrbitingCircles
              className="border border-white/15 bg-white/85 shadow-lg backdrop-blur-xl dark:bg-slate-950/80"
              duration={24}
              iconSize={48}
              radius={100}
            >
              <span className="flex size-full items-center justify-center rounded-full text-violet-600 dark:text-violet-300">
                <MessageSquareMore className="size-5" />
              </span>
              <span className="flex size-full items-center justify-center rounded-full text-cyan-600 dark:text-cyan-300">
                <FileSearch className="size-5" />
              </span>
              <span className="flex size-full items-center justify-center rounded-full text-violet-600 dark:text-violet-300">
                <Clock3 className="size-5" />
              </span>
              <span className="flex size-full items-center justify-center rounded-full text-cyan-600 dark:text-cyan-300">
                <ShieldCheck className="size-5" />
              </span>
              <span className="flex size-full items-center justify-center rounded-full text-violet-600 dark:text-violet-300">
                <Layers3 className="size-5" />
              </span>
              <span className="flex size-full items-center justify-center rounded-full text-cyan-600 dark:text-cyan-300">
                <Target className="size-5" />
              </span>
            </OrbitingCircles>

            <div className="glass relative z-10 flex size-40 flex-col items-center justify-center rounded-full border-white/20 bg-white/88 px-4 text-center dark:bg-slate-950/84 sm:size-44">
              <span className="brand-mark size-14 text-base">IA</span>
              <p className="mt-4 text-lg font-semibold tracking-tight">Your prep loop</p>
              <p className="mt-1 max-w-[9rem] text-sm leading-6 text-muted-foreground">
                Practice, review, improve, and return without losing your place.
              </p>
            </div>
          </div>

          <div className="hero-callout absolute left-4 top-7 z-20 max-w-[11.5rem] rounded-[1.6rem] border border-white/30 bg-white/92 px-4 py-3 text-sm shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/82 sm:left-6 sm:top-8 sm:max-w-[12rem]">
            <p className="font-medium">Daily reminder</p>
            <p className="text-muted-foreground">Pick the time that fits your prep.</p>
          </div>

          <div className="hero-callout hero-callout-delay absolute bottom-7 right-4 z-20 max-w-[11.5rem] rounded-[1.6rem] border border-white/30 bg-white/92 px-4 py-3 text-sm shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/82 sm:bottom-8 sm:right-6 sm:max-w-[12rem]">
            <p className="font-medium">Resume feedback</p>
            <p className="text-muted-foreground">Clear next steps, not vague scores.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PracticeMock() {
  return (
    <div className="absolute inset-x-5 bottom-4 top-[3.9rem] rounded-[1.8rem] border border-white/20 bg-gradient-to-b from-white/86 to-white/58 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] dark:from-slate-950/84 dark:to-slate-950/56">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.26em] text-muted-foreground">Mock interview</p>
          <p className="mt-2 text-base font-semibold sm:text-lg">Keep your flow steady</p>
        </div>
        <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-700 dark:text-cyan-200">
          2 min answer timer
        </span>
      </div>

      <div className="mt-5 space-y-3">
        <div className="rounded-[1.35rem] border border-white/20 bg-white/82 p-4 shadow-sm dark:bg-slate-900/72">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            <MessageSquareMore className="size-3.5" />
            Prompt
          </div>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-700 dark:text-slate-100">
            Tell me about a project where you had to explain a difficult decision clearly.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/20 bg-white/78 px-3 py-2 text-xs font-medium dark:bg-slate-900/66">
            3 rounds today
          </span>
          <span className="rounded-full border border-white/20 bg-white/78 px-3 py-2 text-xs font-medium dark:bg-slate-900/66">
            Saved draft available
          </span>
        </div>
      </div>
    </div>
  );
}

function ResumeMock() {
  return (
    <div className="absolute inset-x-5 bottom-4 top-[3.9rem] rounded-[1.8rem] border border-white/20 bg-gradient-to-b from-white/86 to-white/58 p-4 dark:from-slate-950/84 dark:to-slate-950/56">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.26em] text-muted-foreground">Resume review</p>
          <p className="mt-2 text-base font-semibold sm:text-lg">See what to fix next</p>
        </div>
        <span className="rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-700 dark:text-violet-200">
          ATS-ready guidance
        </span>
      </div>

      <div className="mt-5 space-y-3">
        <div className="rounded-[1.35rem] border border-white/20 bg-white/82 p-4 shadow-sm dark:bg-slate-900/72">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Keyword coverage</p>
            <p className="text-sm text-cyan-600 dark:text-cyan-300">82 / 100</p>
          </div>
          <div className="mt-3 h-2 rounded-full bg-slate-200/70 dark:bg-slate-800/80">
            <div className="h-2 w-[82%] rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/20 bg-white/78 px-3 py-2 text-xs font-medium dark:bg-slate-900/66">
            Keyword gaps highlighted
          </span>
          <span className="rounded-full border border-white/20 bg-white/78 px-3 py-2 text-xs font-medium dark:bg-slate-900/66">
            Results open on a review screen
          </span>
        </div>
      </div>
    </div>
  );
}

function PremiumMock() {
  return (
    <div className="absolute inset-x-5 bottom-4 top-[3.9rem] rounded-[1.8rem] border border-white/20 bg-gradient-to-b from-white/86 to-white/58 p-4 dark:from-slate-950/84 dark:to-slate-950/56">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.26em] text-muted-foreground">Premium access</p>
          <p className="mt-2 text-base font-semibold sm:text-lg">Upgrade when you need more depth</p>
        </div>
        <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-200">
          Verified after payment
        </span>
      </div>

      <div className="mt-5 grid gap-3">
        {[
          "Unlimited mock rounds",
          "Longer sessions for deeper answers",
          "More resume scans and saved checks",
        ].map((item) => (
          <div
            key={item}
            className="flex items-center gap-3 rounded-[1.35rem] border border-white/20 bg-white/78 px-4 py-3 text-sm shadow-sm dark:bg-slate-900/66"
          >
            <CheckCircle2 className="size-4 text-cyan-500" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const bentoItems = [
  {
    Icon: MessageSquareMore,
    background: <PracticeMock />,
    className: "md:col-span-2",
    cta: "See premium plans",
    detail: "More room to think, then return later",
    description:
      "Practice typed answers with enough time to think, then come back later without losing your progress.",
    eyebrow: "Mock answers",
    href: "#premium",
    name: "Practice that fits your pace",
  },
  {
    Icon: FileSearch,
    background: <ResumeMock />,
    className: "md:col-span-1",
    cta: "Explore the beta",
    detail: "See what to edit before your next round",
    description:
      "Resume feedback stays easy to scan so you can move from edits to interview practice quickly.",
    eyebrow: "Resume review",
    href: "#download",
    name: "Feedback you can act on",
  },
  {
    Icon: Layers3,
    background: (
      <div className="absolute inset-x-5 bottom-4 top-[3.9rem] rounded-[1.8rem] border border-white/20 bg-gradient-to-br from-white/86 to-white/56 p-4 dark:from-slate-950/82 dark:to-slate-950/48">
        <p className="text-xs uppercase tracking-[0.26em] text-muted-foreground">Saved progress</p>
        <div className="mt-4 space-y-3">
          <div className="rounded-[1.35rem] border border-white/20 bg-white/82 p-4 shadow-sm dark:bg-slate-900/72">
            <p className="text-sm font-medium">Continue your interview?</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Pick up from your saved question or start fresh if you want a new round.
            </p>
          </div>
          <div className="rounded-[1.35rem] border border-white/20 bg-white/78 p-4 shadow-sm dark:bg-slate-900/66">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Reminder</p>
            <p className="mt-2 text-sm font-medium">Choose a daily practice time that actually works.</p>
          </div>
        </div>
      </div>
    ),
    className: "md:col-span-1",
    cta: "See support options",
    detail: "Saved rounds stay ready on the same device",
    description:
      "Resume a saved round, keep your reminders on your schedule, and stay consistent without friction.",
    eyebrow: "Saved progress",
    href: "#support",
    name: "Come back without starting over",
  },
  {
    Icon: ShieldCheck,
    background: <PremiumMock />,
    className: "md:col-span-2",
    cta: "Download the app",
    detail: "Unlock more only when you need deeper prep",
    description:
      "Free access stays useful. Premium is there when you want more sessions, more scans, and less waiting.",
    eyebrow: "Premium access",
    href: "#download",
    name: "Upgrade only when it helps",
  },
];

export default function Home() {
  return (
    <main className="grain-overlay relative overflow-hidden">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link className="flex items-center gap-3" href="#top">
            <span className="brand-mark">IA</span>
            <div>
              <p className="text-sm font-semibold tracking-tight">IntervueAI</p>
              <p className="text-xs text-muted-foreground">Practice smarter. Interview better.</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            {navLinks.map((link) => (
              <a className="transition-colors hover:text-foreground" href={link.href} key={link.href}>
                {link.label}
              </a>
            ))}
          </nav>

          <Button asChild className="rounded-full px-5 shadow-[0_18px_45px_rgba(99,102,241,0.28)]">
            <a href={apkDownloadUrl}>
              Download APK
              <Download className="size-4" />
            </a>
          </Button>
        </div>
      </header>

      <section className="relative isolate overflow-hidden px-5 pb-16 pt-16 sm:px-8 sm:pt-24" id="top">
        <AnimatedGridPattern
          className="absolute inset-0 -z-10 opacity-60 [mask-image:radial-gradient(700px_circle_at_center,white,transparent)]"
          duration={5}
          maxOpacity={0.18}
          numSquares={54}
          repeatDelay={1}
        />
        <div className="absolute inset-x-0 top-0 -z-10 h-[36rem] bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_30%)]" />

        <div className="mx-auto grid w-full max-w-7xl items-center gap-14 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="max-w-2xl">
            <BlurFade delay={0.05} inView>
              <Badge className="rounded-full bg-violet-500/12 px-4 py-1.5 text-[11px] uppercase tracking-[0.28em] text-violet-700 dark:text-violet-200">
                Android public beta
              </Badge>
            </BlurFade>

            <BlurFade delay={0.12} inView>
              <h1 className="mt-6 text-balance text-5xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-6xl xl:text-7xl">
                Feel ready <span className="text-gradient">before the interview starts.</span>
              </h1>
            </BlurFade>

            <BlurFade delay={0.2} inView>
              <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground sm:text-xl">
                IntervueAI helps you practise answers, clean up your resume, and keep progress moving
                on the days when prep needs to feel simple, not overwhelming.
              </p>
            </BlurFade>

            <BlurFade delay={0.28} inView>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  className="h-12 rounded-full px-6 text-sm font-semibold shadow-[0_20px_50px_rgba(99,102,241,0.28)]"
                  size="lg"
                >
                  <a href={apkDownloadUrl}>
                    Download Android beta
                    <ArrowRight className="size-4" />
                  </a>
                </Button>
                <Button asChild className="h-12 rounded-full px-6" size="lg" variant="outline">
                  <a href="#how-it-helps">See how it works</a>
                </Button>
              </div>
            </BlurFade>

            <BlurFade delay={0.36} inView>
              <div className="mt-8 flex flex-wrap gap-3">
                {quickNotes.map((item) => (
                  <Badge key={item} variant="outline" className="rounded-full px-4 py-1.5">
                    <Star className="mr-1 size-3.5 text-cyan-500" />
                    {item}
                  </Badge>
                ))}
              </div>
            </BlurFade>
          </div>

          <BlurFade className="lg:justify-self-end" delay={0.18} direction="left" inView>
            <OrbitHero />
          </BlurFade>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8" id="how-it-helps">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-10">
          <BlurFade inView>
            <div className="max-w-3xl">
              <Badge variant="outline" className="rounded-full px-4 py-1.5">
                How it helps
              </Badge>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
                Everything you need to prep with less friction.
              </h2>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">
                We built the beta around the moments candidates actually care about: starting
                quickly, understanding what to fix, and returning later without losing momentum.
              </p>
            </div>
          </BlurFade>

          <BlurFade delay={0.12} inView>
            <BentoGrid className="grid-cols-1 auto-rows-[22rem] md:grid-cols-3 md:auto-rows-[23rem]">
              {bentoItems.map((item) => (
                <BentoCard key={item.name} {...item} />
              ))}
            </BentoGrid>
          </BlurFade>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8" id="premium">
        <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <BlurFade inView>
            <Card className="glass relative overflow-hidden rounded-[2rem] border-white/20 bg-white/70 p-0 dark:bg-slate-950/58">
              <div className="absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.22),transparent_55%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_45%)]" />
              <CardHeader className="relative px-6 pt-6">
                <Badge className="w-fit rounded-full bg-violet-500/12 px-3 py-1 text-violet-700 dark:text-violet-200">
                  Premium
                </Badge>
                <CardTitle className="text-3xl tracking-[-0.05em]">
                  Go deeper when you want more reps, more detail, and fewer limits.
                </CardTitle>
              </CardHeader>
              <CardContent className="relative grid gap-3 px-6 pb-6">
                {[
                  "Unlimited mock rounds when you are in a serious prep sprint",
                  "Longer sessions so you can write fuller answers without rushing",
                  "More resume scans and saved checks when you are refining multiple drafts",
                  "Upcoming voice and video modes after beta reliability is locked in",
                ].map((point) => (
                  <div
                    key={point}
                    className="flex items-start gap-3 rounded-[1.2rem] border border-white/15 bg-background/65 px-4 py-3 text-sm leading-7 dark:bg-slate-950/45"
                  >
                    <CheckCircle2 className="mt-1 size-4 shrink-0 text-cyan-500" />
                    <span>{point}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </BlurFade>

          <div className="grid gap-6">
            <BlurFade delay={0.12} inView>
              <Card className="glass rounded-[1.85rem] border-white/20 bg-white/68 p-0 dark:bg-slate-950/56" id="download">
                <CardHeader className="px-6 pt-6">
                  <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
                    Download
                  </Badge>
                  <CardTitle className="text-2xl tracking-[-0.04em]">
                    Start with the Android beta and see how the flow feels for you.
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-6 pb-6">
                  <p className="text-base leading-8 text-muted-foreground">
                    Install the latest build, explore free daily practice, and unlock more only if
                    the extra depth actually helps your prep.
                  </p>
                  <Button
                    asChild
                    className="h-12 w-full rounded-full text-sm font-semibold shadow-[0_18px_50px_rgba(99,102,241,0.28)]"
                    size="lg"
                  >
                    <a href={apkDownloadUrl}>
                      Download APK
                      <Download className="size-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </BlurFade>

            <BlurFade delay={0.18} direction="left" inView>
              <Card className="glass rounded-[1.85rem] border-white/20 bg-white/70 p-0 dark:bg-slate-950/56">
                <CardHeader className="px-6 pt-6">
                  <Badge className="w-fit rounded-full bg-cyan-500/12 px-3 py-1 text-cyan-700 dark:text-cyan-200">
                    Built for confidence
                  </Badge>
                  <CardTitle className="text-2xl tracking-[-0.04em]">
                    You always know what your next step is.
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 px-6 pb-6">
                  <div className="rounded-[1.35rem] border border-white/15 bg-white/70 p-4 dark:bg-slate-900/65">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Free plan</p>
                    <p className="mt-2 text-lg font-semibold">Stay consistent every day</p>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      Enough access to build a routine, revisit saved work, and keep progress moving.
                    </p>
                  </div>
                  <div className="rounded-[1.35rem] border border-white/15 bg-white/70 p-4 dark:bg-slate-900/65">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Premium plan</p>
                    <p className="mt-2 text-lg font-semibold">Open the longer, deeper version of the app</p>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      Best when interviews are close and you want more practice without interruption.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </BlurFade>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8" id="coming-next">
        <div className="mx-auto w-full max-w-7xl">
          <BlurFade inView>
            <div className="mb-10 max-w-3xl">
              <Badge variant="outline" className="rounded-full px-4 py-1.5">
                Coming next
              </Badge>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
                More natural interview modes are on the way.
              </h2>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">
                We want the next features to feel genuinely useful when they arrive, so they are
                being staged carefully instead of rushed into the public beta.
              </p>
            </div>
          </BlurFade>

          <div className="grid gap-6 lg:grid-cols-3">
            {roadmapCards.map((item, index) => {
              const Icon = item.icon;

              return (
                <BlurFade delay={0.1 * (index + 1)} inView key={item.title}>
                  <Card className="glass h-full rounded-[1.75rem] border-white/20 bg-white/66 p-0 dark:bg-slate-950/54">
                    <CardHeader className="px-6 pt-6">
                      <Badge
                        variant="outline"
                        className="w-fit rounded-full border-violet-400/25 bg-violet-500/8 px-3 py-1 text-violet-700 dark:text-violet-200"
                      >
                        {item.label}
                      </Badge>
                      <div className="flex size-12 items-center justify-center rounded-2xl bg-violet-500/12 text-violet-600 dark:text-violet-300">
                        <Icon className="size-5" />
                      </div>
                      <CardTitle className="text-2xl tracking-[-0.04em]">{item.title}</CardTitle>
                      <p className="text-base leading-7 text-muted-foreground">{item.description}</p>
                    </CardHeader>
                  </Card>
                </BlurFade>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 pt-10 sm:px-8" id="support">
        <div className="mx-auto w-full max-w-7xl">
          <BlurFade inView>
            <Card className="glass overflow-hidden rounded-[2rem] border-white/20 bg-white/70 p-0 dark:bg-slate-950/58">
              <CardContent className="grid gap-8 px-6 py-8 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <Badge className="rounded-full bg-cyan-500/12 px-3 py-1 text-cyan-700 dark:text-cyan-200">
                    Support
                  </Badge>
                  <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
                    Need help with installs, sign-in, or premium access?
                  </h2>
                  <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground">
                    Reach out for beta install help, account access questions, or payment support.
                    We want the app to feel calm and dependable from the first install onward.
                  </p>
                </div>

                <div className="flex flex-col gap-4 md:items-end">
                  <Button asChild className="h-12 rounded-full px-6 text-sm font-semibold" size="lg">
                    <a href={supportEmailHref}>
                      <Mail className="size-4" />
                      {supportEmail}
                    </a>
                  </Button>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <Link href="/privacy">Privacy</Link>
                    <Separator className="h-4" orientation="vertical" />
                    <Link href="/terms">Terms</Link>
                    <Separator className="h-4" orientation="vertical" />
                    <Link href="/refund">Refund</Link>
                    <Separator className="h-4" orientation="vertical" />
                    <Link href="/delivery">Delivery</Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </BlurFade>
        </div>
      </section>
    </main>
  );
}
