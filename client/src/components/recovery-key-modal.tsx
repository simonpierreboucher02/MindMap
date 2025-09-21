import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, Copy, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RecoveryKeyModalProps {
  recoveryKey: string;
  onClose: () => void;
}

export function RecoveryKeyModal({ recoveryKey, onClose }: RecoveryKeyModalProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(recoveryKey);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Recovery key copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the key manually",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="recovery-modal">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-destructive" />
          </div>
          <DialogTitle className="text-center">Your Recovery Key</DialogTitle>
          <DialogDescription className="text-center">
            Save this key securely. You'll need it to reset your password.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted rounded-lg p-4 mb-4">
          <div className="recovery-key text-center text-lg font-mono text-foreground tracking-wider" data-testid="text-recovery-key">
            {recoveryKey}
          </div>
        </div>

        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
            <div>
              <p className="text-xs font-medium text-destructive">Important</p>
              <p className="text-xs text-destructive">
                This key is shown only once. Store it safely offline.
              </p>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <Button 
            onClick={onClose} 
            className="flex-1"
            data-testid="button-saved-it"
          >
            I've Saved It
          </Button>
          <Button
            variant="outline"
            onClick={handleCopy}
            data-testid="button-copy-key"
          >
            <Copy className="w-4 h-4 mr-2" />
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
