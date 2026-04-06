const fs=require('fs');let c=fs.readFileSync('src/components/settings/brand-settings-form.tsx','utf8');let idx=c.indexOf('<div className=\"grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]\">');if(idx!==-1){let newContent=c.substring(0,idx)+\      <div className=\"flex flex-col gap-6 md:flex-row md:items-start\">
        <aside className=\"flex shrink-0 flex-col gap-1 md:w-60 lg:w-72\">
          {questionSteps.map((step) => {
            const isActive = step.id === activeStepId;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStepId(step.id)}
                type=\"button\"
                className={cn(
                  'flex items-center justify-between rounded-xl px-4 py-2.5 text-left text-sm transition-all',
                  isActive
                    ? 'bg-slate-900 text-white font-medium shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                <span>{step.title}</span>
                <span className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                )}>
                  {step.questions.length}
                </span>
              </button>
            );
          })}
        </aside>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSave();
          }}
          className=\"flex-1 space-y-5\"
        >
          {questionSteps.filter(s => s.id === activeStepId).map((step) => (
            <section
              key={step.id}
              className=\"rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/2 sm:p-6\"
            >
              <div className=\"mb-5 space-y-2\">
                <h2 className=\"text-xl font-semibold tracking-tight text-slate-950\">{step.title}</h2>
                <p className=\"max-w-2xl text-sm leading-6 text-slate-600\">{step.description}</p>
              </div>

              <div className=\"space-y-6\">
                {step.questions.map((question) => (
                  <div key={question.key} className=\"space-y-1\">
                    {renderQuestion(question)}
                  </div>
                ))}
              </div>
            </section>
          ))}

          <div className=\"flex flex-wrap items-center justify-end gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/2\">
            {saveError ? (
              <div className=\"flex-1 text-sm font-medium text-rose-600\">
                {saveError}
              </div>
            ) : null}

            {saveState === 'saved' ? (
              <div className=\"flex items-center justify-center gap-2 text-sm font-medium text-emerald-600\">
                <CheckCircle className=\"size-4\" weight=\"fill\" />
                Saved
              </div>
            ) : null}

            <Button type=\"submit\" disabled={isPending} className=\"h-10 rounded-xl px-5 text-sm font-semibold\">
              {isPending ? (
                <>
                  <SpinnerGap className=\"size-4 animate-spin\" />
                  Saving...
                </>
              ) : (
                'Save changes'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}\;fs.writeFileSync('src/components/settings/brand-settings-form.tsx',newContent);}else{console.log('Not found');}
