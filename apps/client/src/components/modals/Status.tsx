import { useSetAtom } from 'jotai';
import { useId } from 'react';
import { useForm } from 'react-hook-form';

import { modalState } from '@/components/ContextMenu';
import { Button, DialogContent, Field, Form, Input } from '@/design';

export function SetStatusModal() {
  const setModalState = useSetAtom(modalState);
  const form = useForm<{ status: string }>({ defaultValues: { status: '' } });
  const formId = useId();

  return (
    <DialogContent
      size="sm"
      title="Set a status"
      description="Let people know what you're up to."
      footer={
        <>
          <Button variant="ghost" onClick={() => form.reset({ status: '' })}>
            Clear status
          </Button>
          <Button variant="primary" type="submit" form={formId}>
            Set status
          </Button>
        </>
      }
    >
      <Form
        id={formId}
        onSubmit={form.handleSubmit((data) => {
          console.log(data);
          setModalState(null);
        })}
      >
        <Field label="Status">
          <Input
            autoComplete="off"
            placeholder="In a meeting until 3"
            maxLength={128}
            {...form.register('status')}
          />
        </Field>
      </Form>
    </DialogContent>
  );
}
