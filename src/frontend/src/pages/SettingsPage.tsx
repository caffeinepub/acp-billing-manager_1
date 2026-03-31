import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { CompanySettings } from "../backend";
import { useActor } from "../hooks/useActor";

const defaultSettings: CompanySettings = {
  companyName: "PRA PANELS PRIVATE LIMITED",
  address: {
    street:
      "Near Udyod Bhawan, 1st Floor, PRA House, Telibandha, Raipur, Chhattisgarh 492004",
    city: "Raipur",
    state: "Chhattisgarh",
    country: "India",
    phone: "8282828644",
    email: "accounts@prapanel.com",
  },
  gstin: "20AANCP2062R1Z3",
  phone: "8282828644",
  email: "accounts@prapanel.com",
  bankName: "BANK OF BARODA",
  accountNumber: "05100500000532",
  branchAndIfsc: "MAHAVIR GOUSHALA RAIPUR & BARB0RAIPUR",
  termsAndConditions:
    "1) Interest @18% P.A. will be charged if the bill is not paid Within 30 days from date of invoice.\n2) Our Responsibility ceases as soon as the goods leave premises and no claims in respect of breakage and lost in transit shall be entertained.\n3) TCS (U/s 206C(1H) Income Tax Act) Will Be Separately Charged at 0.1% on value of Receipts Exceeding Rs.50 Lakhs P.A. w.e.f. 01.10.2020, if it is applicable\n4) All the disputes subject to Raipur Jurisdiction",
};

export default function SettingsPage() {
  const { actor, isFetching } = useActor();
  const qc = useQueryClient();
  const [form, setForm] = useState<CompanySettings>(defaultSettings);

  const { data: settings } = useQuery({
    queryKey: ["companySettings"],
    queryFn: () => actor!.getCompanySettings(),
    enabled: !!actor && !isFetching,
  });

  useEffect(() => {
    if (settings) {
      setForm(settings);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: (s: CompanySettings) => actor!.updateCompanySettings(s),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["companySettings"] });
      toast.success("Settings saved!");
    },
    onError: () => toast.error("Failed to save settings"),
  });

  const setAddr = (key: keyof CompanySettings["address"], value: string) => {
    setForm((f) => ({ ...f, address: { ...f.address, [key]: value } }));
  };

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Company Info */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm">Company Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Company Name</Label>
            <Input
              data-ocid="settings.company_name.input"
              value={form.companyName}
              onChange={(e) =>
                setForm((f) => ({ ...f, companyName: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Textarea
              data-ocid="settings.address.textarea"
              value={form.address.street}
              onChange={(e) => setAddr("street", e.target.value)}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input
                value={form.address.city}
                onChange={(e) => setAddr("city", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>State</Label>
              <Input
                value={form.address.state}
                onChange={(e) => setAddr("state", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>GSTIN</Label>
              <Input
                data-ocid="settings.gstin.input"
                value={form.gstin}
                onChange={(e) =>
                  setForm((f) => ({ ...f, gstin: e.target.value }))
                }
                className="uppercase"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                data-ocid="settings.phone.input"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input
              data-ocid="settings.email.input"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Bank Details */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm">Bank Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Bank Name</Label>
            <Input
              data-ocid="settings.bank_name.input"
              value={form.bankName}
              onChange={(e) =>
                setForm((f) => ({ ...f, bankName: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Account Number</Label>
            <Input
              data-ocid="settings.account_number.input"
              value={form.accountNumber}
              onChange={(e) =>
                setForm((f) => ({ ...f, accountNumber: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Branch &amp; IFSC Code</Label>
            <Input
              data-ocid="settings.ifsc.input"
              value={form.branchAndIfsc}
              onChange={(e) =>
                setForm((f) => ({ ...f, branchAndIfsc: e.target.value }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Terms */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm">Terms &amp; Conditions</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            data-ocid="settings.terms.textarea"
            value={form.termsAndConditions}
            onChange={(e) =>
              setForm((f) => ({ ...f, termsAndConditions: e.target.value }))
            }
            rows={6}
            placeholder="Enter terms and conditions..."
          />
        </CardContent>
      </Card>

      <Button
        data-ocid="settings.save.button"
        className="bg-accent hover:bg-accent/90 text-accent-foreground"
        onClick={() => saveMutation.mutate(form)}
        disabled={saveMutation.isPending}
      >
        {saveMutation.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save size={14} className="mr-1" />
        )}
        Save Settings
      </Button>
    </div>
  );
}
