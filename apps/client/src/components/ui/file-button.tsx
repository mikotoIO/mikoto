'use client';

import type { ButtonProps, RecipeProps } from '@chakra-ui/react';
import {
  Button,
  FileUpload as ChakraFileUpload,
  Icon,
  IconButton,
  Span,
  Text,
  useFileUploadContext,
  useRecipe,
} from '@chakra-ui/react';
import 'react';
import { LuFile, LuUpload, LuX } from 'react-icons/lu';

export interface FileUploadRootProps extends ChakraFileUpload.RootProps {
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

export const FileUploadRoot = function FileUploadRoot(
  props: FileUploadRootProps,
) {
  const { children, inputProps, ...rest } = props;
  return (
    <ChakraFileUpload.Root {...rest}>
      <ChakraFileUpload.HiddenInput {...inputProps} />
      {children}
    </ChakraFileUpload.Root>
  );
};

export interface FileUploadDropzoneProps
  extends ChakraFileUpload.DropzoneProps {
  label: React.ReactNode;
  description?: React.ReactNode;
}

export const FileUploadDropzone = function FileUploadDropzone(
  props: FileUploadDropzoneProps,
) {
  const { children, label, description, ...rest } = props;
  return (
    <ChakraFileUpload.Dropzone {...rest}>
      <Icon fontSize="xl" color="fg.muted">
        <LuUpload />
      </Icon>
      <ChakraFileUpload.DropzoneContent>
        <div>{label}</div>
        {description && <Text color="fg.muted">{description}</Text>}
      </ChakraFileUpload.DropzoneContent>
      {children}
    </ChakraFileUpload.Dropzone>
  );
};

interface VisibilityProps {
  showSize?: boolean;
  clearable?: boolean;
}

interface FileUploadItemProps extends VisibilityProps {
  file: File;
}

const FileUploadItem = (props: FileUploadItemProps) => {
  const { file, showSize, clearable } = props;
  return (
    <ChakraFileUpload.Item file={file}>
      <ChakraFileUpload.ItemPreview asChild>
        <Icon fontSize="lg" color="fg.muted">
          <LuFile />
        </Icon>
      </ChakraFileUpload.ItemPreview>

      {showSize ? (
        <ChakraFileUpload.ItemContent>
          <ChakraFileUpload.ItemName />
          <ChakraFileUpload.ItemSizeText />
        </ChakraFileUpload.ItemContent>
      ) : (
        <ChakraFileUpload.ItemName flex="1" />
      )}

      {clearable && (
        <ChakraFileUpload.ItemDeleteTrigger asChild>
          <IconButton variant="ghost" color="fg.muted" size="xs">
            <LuX />
          </IconButton>
        </ChakraFileUpload.ItemDeleteTrigger>
      )}
    </ChakraFileUpload.Item>
  );
};

interface FileUploadListProps
  extends VisibilityProps,
    ChakraFileUpload.ItemGroupProps {
  files?: File[];
}

export const FileUploadList = function FileUploadList(
  props: FileUploadListProps,
) {
  const { showSize, clearable, files, ...rest } = props;

  const fileUpload = useFileUploadContext();
  const acceptedFiles = files ?? fileUpload.acceptedFiles;

  if (acceptedFiles.length === 0) return null;

  return (
    <ChakraFileUpload.ItemGroup {...rest}>
      {acceptedFiles.map((file) => (
        <FileUploadItem
          key={file.name}
          file={file}
          showSize={showSize}
          clearable={clearable}
        />
      ))}
    </ChakraFileUpload.ItemGroup>
  );
};

type Assign<T, U> = Omit<T, keyof U> & U;

interface FileInputProps extends Assign<ButtonProps, RecipeProps<'input'>> {
  placeholder?: React.ReactNode;
}

export const FileInput = function FileInput(props: FileInputProps) {
  const inputRecipe = useRecipe({ key: 'input' });
  const [recipeProps, restProps] = inputRecipe.splitVariantProps(props);
  const { placeholder = 'Select file(s)', ...rest } = restProps;
  return (
    <ChakraFileUpload.Trigger asChild>
      <Button
        unstyled
        py="0"
        {...rest}
        css={[inputRecipe(recipeProps), props.css]}
      >
        <ChakraFileUpload.Context>
          {({ acceptedFiles }) => {
            if (acceptedFiles.length === 1) {
              return <span>{acceptedFiles[0].name}</span>;
            }
            if (acceptedFiles.length > 1) {
              return <span>{acceptedFiles.length} files</span>;
            }
            return <Span color="fg.subtle">{placeholder}</Span>;
          }}
        </ChakraFileUpload.Context>
      </Button>
    </ChakraFileUpload.Trigger>
  );
};

export const FileUploadLabel = ChakraFileUpload.Label;
export const FileUploadClearTrigger = ChakraFileUpload.ClearTrigger;
export const FileUploadTrigger = ChakraFileUpload.Trigger;
