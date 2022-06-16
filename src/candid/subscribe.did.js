export const idlFactory = ({ IDL }) => {
  const question = IDL.Record({
    email_address: IDL.Text,
    question_content: IDL.Text,
    company_name: IDL.Opt(IDL.Text),
    first_name: IDL.Opt(IDL.Text),
    last_name: IDL.Opt(IDL.Text)
  })
  const add_question_response = IDL.Variant({
    ok: question,
    err: IDL.Variant({ Other: IDL.Text })
  })
  const add_subscriber_response = IDL.Variant({
    ok: IDL.Text,
    err: IDL.Variant({ Other: IDL.Text })
  })
  return IDL.Service({
    add_question: IDL.Func([question], [add_question_response], []),
    add_subscriber: IDL.Func([IDL.Text], [add_subscriber_response], [])
  })
}
export const init = ({ IDL }) => {
  return []
}
