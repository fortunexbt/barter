import { useState } from "react";
import { ArrowRight, CheckCircle, FileImage, Shield, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

const identityFixtures = [
  {
    id: "IDF-0174-ALPHA",
    label: "Fixture Alpha · exporter",
    recordType: "Synthetic trade credential",
    subject: "Huila Export Cooperative",
    jurisdiction: "Demo jurisdiction A",
  },
  {
    id: "IDF-0288-BRAVO",
    label: "Fixture Bravo · carrier",
    recordType: "Synthetic operator credential",
    subject: "Adriatic Freight Fixture",
    jurisdiction: "Demo jurisdiction B",
  },
  {
    id: "IDF-0312-CHARLIE",
    label: "Fixture Charlie · foundry",
    recordType: "Synthetic buyer credential",
    subject: "Andes Metals Desk",
    jurisdiction: "Demo jurisdiction C",
  },
] as const;

interface KycVerificationFormProps {
  onComplete?: (identityState: string) => void;
  onShowZkpModal: () => void;
}

export function KycVerificationForm({
  onComplete,
  onShowZkpModal,
}: KycVerificationFormProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fixtureId, setFixtureId] = useState<string>(identityFixtures[0].id);
  const fixture = identityFixtures.find((item) => item.id === fixtureId) ?? identityFixtures[0];

  const continueWithFixture = () => {
    setStep(2);
    toast({
      title: "Synthetic Fixture Loaded",
      description: `${fixture.id} is local demo data. No document was uploaded or retained.`,
    });
  };

  const openProofExperiment = () => {
    setStep(3);
    onShowZkpModal();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Fixture flow</span>
          <span>Step {step} of 3</span>
        </div>
        <Progress value={(step / 3) * 100} className="h-2" />
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex flex-col items-start gap-3 sm:flex-row">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
                <ShieldAlert className="h-5 w-5 text-amber-700" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h4 className="text-base font-medium text-amber-950">Real document intake is disabled</h4>
                <p className="mt-1 text-sm text-amber-900/80">
                  This repository is not an identity provider. Choose a named synthetic fixture below;
                  there is no file picker, document number field, upload request, or persistence step.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="identity-fixture">
              Synthetic identity fixture
            </label>
            <Select value={fixtureId} onValueChange={setFixtureId}>
              <SelectTrigger id="identity-fixture">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {identityFixtures.map((item) => (
                  <SelectItem value={item.id} key={item.id}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              All fixture names, references, and outcomes are invented for interface testing.
            </p>
          </div>

          <div className="rounded-lg border-2 border-dashed p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <FileImage className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <dl className="grid flex-1 gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Fixture ID</dt>
                  <dd className="font-mono font-medium">{fixture.id}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Record class</dt>
                  <dd>{fixture.recordType}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Synthetic subject</dt>
                  <dd>{fixture.subject}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">File intake</dt>
                  <dd className="font-medium text-amber-700">Disabled</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="button" onClick={continueWithFixture}>
              Load {fixture.id}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="rounded-lg border bg-blue-50 p-4">
            <div className="flex flex-col items-start gap-3 sm:flex-row">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                <Shield className="h-5 w-5 text-blue-600" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h4 className="text-base font-medium">Challenge-Response Experiment</h4>
                <p className="mt-1 text-sm text-blue-700/80">
                  {fixture.id} will exercise a local proof-shaped interaction. It is not zero knowledge
                  and does not establish identity, eligibility, KYC, or counterparty trust.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <h5 className="mb-2 text-sm font-medium">Experiment boundary</h5>
            <p className="text-sm text-muted-foreground">
              A production identity system would require trusted issuance, regulated review, secure key
              handling, revocation, retention controls, and an independent audit. None are implemented here.
            </p>
          </div>

          <div className="flex justify-end">
            <Button type="button" onClick={openProofExperiment}>
              Run Fixture Experiment
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div className="rounded-lg border bg-green-50 p-4">
            <div className="flex flex-col items-start gap-3 sm:flex-row">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h4 className="text-base font-medium">Fixture Flow Opened</h4>
                <p className="mt-1 text-sm text-green-700/80">
                  The synthetic flow was launched with {fixture.id}. No identity status, account access,
                  document, or assurance changed.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="button" onClick={() => onComplete?.("fixture_complete")}>
              Return to Prototype
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
