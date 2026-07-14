"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Shield,
  Zap,
  RefreshCw,
  Cloud,
  Check,
  ChevronDown,
  HardDrive,
  Timer,
  Bell,
  Server,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const stagger = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true },
  transition: { staggerChildren: 0.1 },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-0 right-0 -z-10 h-96 w-96 translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -z-10 h-64 w-64 -translate-x-1/2 translate-y-1/2 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div {...fadeIn}>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-8">
              <Zap className="h-4 w-4" />
              <span>Automated Cloud Account Maintenance</span>
            </div>
          </motion.div>

          <motion.h1
            className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Keep Your Cloud
            <br />
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Accounts Active
            </span>
          </motion.h1>

          <motion.p
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            CloudKeeper automates login sessions for your cloud storage accounts.
            No more manual logins. No more account suspensions. Set it and forget it.
          </motion.p>

          <motion.div
            className="mt-10 flex items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link href="/register">
              <Button size="xl" className="gap-2">
                Get Started Free <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="xl">
                Sign In
              </Button>
            </Link>
          </motion.div>

          {/* Provider badges */}
          <motion.div
            className="mt-16 flex flex-wrap items-center justify-center gap-6 text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {["MEGA", "Google Drive", "Dropbox", "pCloud", "Proton Drive", "MediaFire", "Icedrive"].map(
              (name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs font-medium"
                >
                  <HardDrive className="h-3.5 w-3.5" />
                  {name}
                </span>
              )
            )}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="mt-20 flex justify-center"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="h-6 w-6 text-muted-foreground/40" />
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border/40 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center" {...fadeIn}>
            <h2 className="text-3xl font-bold sm:text-4xl">
              Everything You Need to Maintain Your Accounts
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              CloudKeeper handles the tedious parts of cloud account maintenance.
            </p>
          </motion.div>

          <motion.div
            className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
            variants={stagger}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
          >
            {[
              {
                icon: RefreshCw,
                title: "Automatic Login",
                description:
                  "Scheduled logins keep your accounts active. CloudKeeper automatically signs in to prevent suspension.",
              },
              {
                icon: Shield,
                title: "Secure Credentials",
                description:
                  "Your passwords are encrypted with AES-256-GCM before storage. We never see your plaintext credentials.",
              },
              {
                icon: Bell,
                title: "Smart Notifications",
                description:
                  "Get alerts via Telegram, Discord, or email when an account fails login or requires attention.",
              },
              {
                icon: Timer,
                title: "Scheduled Maintenance",
                description:
                  "Set custom intervals for each account. Daily, weekly, or custom schedules tailored to provider requirements.",
              },
              {
                icon: Server,
                title: "Multi-Provider",
                description:
                  "Support for MEGA, Google Drive, Dropbox, pCloud, Proton Drive, MediaFire, and Icedrive — all in one place.",
              },
              {
                icon: Cloud,
                title: "Central Dashboard",
                description:
                  "Monitor all your cloud accounts from a single dashboard. View status, history, and logs at a glance.",
              },
            ].map((feature, i) => (
              <motion.div key={i} variants={fadeIn}>
                <Card className="group relative overflow-hidden border-border/50 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="mt-4 text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-border/40 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center" {...fadeIn}>
            <h2 className="text-3xl font-bold sm:text-4xl">How It Works</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Three simple steps to never worry about expired accounts again.
            </p>
          </motion.div>

          <motion.div
            className="mt-16 grid gap-8 md:grid-cols-3"
            variants={stagger}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
          >
            {[
              {
                step: "01",
                title: "Connect Accounts",
                description: "Add your cloud storage accounts securely. Your credentials are encrypted before they ever touch our servers.",
              },
              {
                step: "02",
                title: "Set Schedule",
                description: "Choose how often each account should be checked. CloudKeeper handles the rest automatically.",
              },
              {
                step: "03",
                title: "Relax",
                description: "Monitor everything from your dashboard. Get notified only when something needs your attention.",
              },
            ].map((item, i) => (
              <motion.div key={i} className="relative" variants={fadeIn}>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-lg font-bold text-primary">
                  {item.step}
                </div>
                {i < 2 && (
                  <div className="absolute top-6 left-12 hidden h-px w-full bg-gradient-to-r from-primary/30 to-transparent md:block" />
                )}
                <h3 className="mt-6 text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border/40 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center" {...fadeIn}>
            <h2 className="text-3xl font-bold sm:text-4xl">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Start free. Upgrade when you need more accounts.
            </p>
          </motion.div>

          <motion.div
            className="mt-16 grid gap-8 lg:grid-cols-3 max-w-5xl mx-auto"
            variants={stagger}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
          >
            {[
              {
                name: "Free",
                price: "$0",
                description: "Perfect for trying out CloudKeeper",
                features: ["Up to 3 accounts", "Weekly maintenance", "Email notifications", "Basic dashboard"],
              },
              {
                name: "Pro",
                price: "$9",
                description: "Best for regular users",
                features: [
                  "Up to 15 accounts",
                  "Daily maintenance",
                  "Email + Telegram notifications",
                  "Priority support",
                  "Detailed logs",
                ],
                popular: true,
              },
              {
                name: "Enterprise",
                price: "$29",
                description: "For power users and teams",
                features: [
                  "Unlimited accounts",
                  "Custom schedules",
                  "All notification channels",
                  "API access",
                  "Dedicated support",
                  "Team management",
                ],
              },
            ].map((plan, i) => (
              <motion.div key={i} variants={fadeIn}>
                <Card
                  className={cn(
                    "relative flex h-full flex-col border-border/50 transition-all duration-300",
                    plan.popular && "border-primary/50 shadow-lg shadow-primary/10 scale-105"
                  )}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <CardDescription className="mt-2">{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-3">
                      {plan.features.map((feature, j) => (
                        <li key={j} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <div className="p-6 pt-0">
                    <Link href={plan.popular ? "/register" : "/register"}>
                      <Button
                        variant={plan.popular ? "default" : "outline"}
                        className="w-full"
                      >
                        {plan.popular ? "Get Started" : "Start Free Trial"}
                      </Button>
                    </Link>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border/40 py-20 lg:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center" {...fadeIn}>
            <h2 className="text-3xl font-bold sm:text-4xl">Frequently Asked Questions</h2>
          </motion.div>

          <motion.div className="mt-12 space-y-4" {...stagger}>
            {[
              {
                q: "Is my data secure?",
                a: "Absolutely. All credentials are encrypted with AES-256-GCM before storage. We never have access to your plaintext passwords. Our encryption key is stored separately and never exposed.",
              },
              {
                q: "Which cloud providers do you support?",
                a: "We currently support MEGA, Google Drive, Dropbox, pCloud, Proton Drive, MediaFire, and Icedrive. We're actively working on adding more providers.",
              },
              {
                q: "How does automated maintenance work?",
                a: "CloudKeeper securely stores your credentials and uses them to perform automated login sessions at scheduled intervals. This prevents account suspension due to inactivity. You can customize the schedule for each account.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes, you can cancel your subscription at any time. Your data will be retained for 30 days in case you want to reactivate. After that, all encrypted data is permanently deleted.",
              },
            ].map((faq, i) => (
              <motion.details
                key={i}
                className="group rounded-lg border border-border/50 p-4 transition-colors hover:border-border"
                variants={fadeIn}
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-medium">
                  {faq.q}
                  <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{faq.a}</p>
              </motion.details>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/40 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div className="mx-auto max-w-2xl" {...fadeIn}>
            <h2 className="text-3xl font-bold sm:text-4xl">
              Ready to Never Worry About Expired Accounts Again?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join CloudKeeper today and automate your cloud storage account maintenance.
            </p>
            <div className="mt-10">
              <Link href="/register">
                <Button size="xl" className="gap-2">
                  Get Started Free <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}