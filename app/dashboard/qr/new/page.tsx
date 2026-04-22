import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import NewQrForm from './NewQrForm';

export default function NewQrPage() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <Button href="/dashboard/qr" plain className="-ml-2 mb-2 text-sm text-neutral-400">
          ← Back to QR codes
        </Button>
        <Heading className="font-display">New QR code</Heading>
        <Text className="mt-2 max-w-lg">
          Choose a target type and label. You&apos;ll be taken to the print editor
          where you can customise and download the QR sheet.
        </Text>
      </header>

      <NewQrForm />
    </div>
  );
}
