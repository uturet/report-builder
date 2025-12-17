import { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

type TextEditorProps = {
  value: string;
  onChange: (html: string) => void;
};

export default function TextEditor({ value, onChange }: TextEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<Quill | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (quillRef.current !== null) return;
    quillRef.current = new Quill(containerRef.current, {theme: "snow"});

    const handleChange = () => {
      const html = quillRef.current?.root.innerHTML ?? "";
      onChange(html);
    };

    quillRef.current.on("text-change", handleChange);
    quillRef.current.root.innerHTML = value ?? "";
  }, []);

  return <div>
    <div style={{minHeight: '300px'}} ref={containerRef} />
  </div>;
}
