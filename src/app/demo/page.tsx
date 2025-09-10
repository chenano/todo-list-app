'use client';

import { TaskComponentsDemo } from '@/components/tasks/demo';

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Todo App Demo
          </h1>
          <p className="text-gray-600">
            Interactive demo of all todo app components and functionality
          </p>
        </div>
        
        <TaskComponentsDemo />
      </div>
    </div>
  );
}